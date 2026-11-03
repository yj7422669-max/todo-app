# kind 배포

이 파일의 생성·적용 명령은 **배포 승인 후** 실행합니다. 기존 Compose, 로컬 DB와 분리된
`todo` namespace 및 새 PVC를 사용하며 기존 데이터는 자동 이전하지 않습니다.

## 구성

- Web / API / PostgreSQL: 각각 Deployment 1개와 ClusterIP Service 1개.
- 브라우저 → Ingress(`todo.local`) → Web:3000 → `/api/*` rewrite → API:4000 → db:5432.
  Ingress는 모든 경로를 Web으로 전달하므로 포트 포워딩에서도 동일한 API 프록시를 사용합니다.
- `todo-config`: DB 일반 설정과 API 주소. API 주소는 Web **빌드 인자에도** 동일하게 전달해야 합니다.
  ConfigMap만 바꿔서는 빌드에 포함된 rewrite가 바뀌지 않습니다.
- `todo-db-secret`: DB와 API가 같은 `POSTGRES_PASSWORD` 키를 참조합니다.
  `secret.yaml.example`은 빈 형식 예제이며 Kustomize에 포함하지 않습니다.
- `postgres-data`: kind 기본 `standard` StorageClass의 1Gi RWO PVC.
  PostgreSQL은 Recreate 전략으로 동일 PVC를 두 Pod가 동시에 사용하지 않게 합니다.
- 초기 SQL은 ConfigMap으로 마운트되며 빈 DB 최초 실행에만 적용됩니다.
  `001-init.sql`은 `db/init.sql`의 사본입니다. 스키마 변경 시 함께 갱신하세요.
- DB startup/readiness, API startup/readiness/liveness, Web startup/readiness/liveness probe와
  CPU/memory request 및 memory limit을 지정했습니다. API는 DB 연결 성공 후 수신을 시작합니다.
  API `/api/health`는 실행 상태만 확인하며 지속적인 DB 상태 확인은 `/api/todos`로 합니다.

## 1. 클러스터와 Ingress 사전 조건

```bash
kind get clusters
kubectl --context kind-todo-cluster get nodes
kubectl --context kind-todo-cluster get storageclass
```

클러스터가 **없을 때만** 생성합니다. 기존 클러스터를 삭제하거나 재생성하지 마세요.

```bash
kind create cluster --config k8s/kind-config.yaml
```

Ingress는 [kind 공식 Ingress 가이드](https://kind.sigs.k8s.io/docs/user/ingress/)의
cloud-provider-kind **v0.9.0 이상**을 전제로 합니다. 해당 도구를 설치하고 별도 터미널에서
Docker 접근 권한으로 실행합니다(설치·실행은 이 변경에서 수행하지 않음).

```bash
cloud-provider-kind
```

IngressClass는 기본 컨트롤러를 사용하도록 생략했습니다. 기존 다른 컨트롤러를 사용한다면
`ingress.yaml`의 `spec.ingressClassName`을 해당 클래스에 맞춰 지정하세요.
Ingress 리소스만으로는 외부 트래픽을 처리하지 않습니다.

## 2. 로컬 이미지 빌드 및 kind 로드

프로젝트 루트에서:

```bash
docker build -t todo-api:kind ./api
docker build --build-arg API_INTERNAL_URL=http://api:4000 -t todo-web:kind .
kind load docker-image todo-api:kind todo-web:kind --name todo-cluster
```

두 앱의 `imagePullPolicy: Never`는 레지스트리 대신 로드한 로컬 이미지만 사용합니다.
PostgreSQL의 공개 이미지는 노드에서 pull합니다. 오프라인이면 다음도 먼저 실행하세요.

```bash
docker pull postgres:17-alpine
kind load docker-image postgres:17-alpine --name todo-cluster
```

동일 태그로 재빌드한 경우 kind에 다시 로드하고 Web/API Deployment를 restart해야 합니다.
Compose 이미지에는 별도 태그를 사용하므로 영향을 주지 않습니다.

## 3. 검증과 배포 (승인 후)

```bash
kubectl kustomize k8s
kubectl --context kind-todo-cluster apply --dry-run=client -k k8s
kubectl --context kind-todo-cluster apply -f k8s/namespace.yaml
bash k8s/create-secret.sh
kubectl --context kind-todo-cluster apply --dry-run=server -k k8s
kubectl --context kind-todo-cluster apply -k k8s
kubectl --context kind-todo-cluster -n todo rollout status deployment/db --timeout=180s
kubectl --context kind-todo-cluster -n todo rollout status deployment/api --timeout=180s
kubectl --context kind-todo-cluster -n todo rollout status deployment/web --timeout=180s
kubectl --context kind-todo-cluster -n todo get pods,svc,pvc,ingress
```

Secret 스크립트는 비밀번호를 숨김 입력으로 받아 stdin으로 전달하며 파일과 shell history에
남기지 않습니다. `bash -x` 또는 `set -x`로 실행하지 마세요. 실제 Secret YAML을 Git에 추가하지 마세요.
Kubernetes Secret은 암호화 저장을 자동 보장하지 않으므로 클러스터 접근 권한도 관리해야 합니다.
기존 PVC의 비밀번호는 Secret만 변경해도 변경되지 않습니다. DB 내부 비밀번호 변경과
API 재시작을 함께 계획해야 합니다. 일반 설정 변경 후에도 관련 Deployment를 restart하세요.

## 4. 통신 확인

Ingress ADDRESS가 할당되면 Linux/WSL에서 해당 IP로 확인합니다.

```bash
kubectl --context kind-todo-cluster -n todo get ingress todo
# 아래 IP는 출력된 ADDRESS로 교체
curl --resolve todo.local:80:INGRESS_IP http://todo.local/api/health
curl --resolve todo.local:80:INGRESS_IP http://todo.local/api/todos
```

브라우저는 hosts 파일에 `INGRESS_IP todo.local`을 등록한 뒤 `http://todo.local`로 접속합니다.
Docker Desktop/WSL 환경에서 해당 IP에 직접 접근할 수 없거나 Ingress 컨트롤러가 없다면
다음으로 Web과 API 프록시를 별도 확인할 수 있습니다. 이는 Ingress 검증을 대신하지 않습니다.

```bash
kubectl --context kind-todo-cluster -n todo port-forward svc/web 3001:3000
# 별도 터미널
curl http://localhost:3001/api/health
curl http://localhost:3001/api/todos
```

`http://localhost:3001`에서 Todo 추가·완료 변경·삭제를 확인합니다.
데이터 보존은 만든 Todo가 `kubectl --context kind-todo-cluster -n todo rollout restart deployment/db`
이후에도 남는지 확인합니다(DB 재기동 동안 API 요청은 일시 실패할 수 있음).

PVC는 Pod 교체 후 유지되지만 kind 노드 컨테이너 내부 저장소입니다.
**PVC/namespace/클러스터 삭제는 데이터 손실로 이어질 수 있습니다.**
`standard`의 기본 reclaimPolicy가 Delete이면 PVC 삭제 시 PV도 삭제됩니다.
클러스터 삭제까지 견디는 백업은 별도 PostgreSQL 백업·복원으로 마련해야 합니다.
`kubectl delete -k k8s`, namespace/PVC 삭제 및 `kind delete cluster`는 실행하지 마세요.

## 이번 준비 작업의 검증 결과

- `kubectl kustomize k8s`: 11개 리소스 렌더링 성공.
- 기존 `kind-todo-cluster` Kubernetes API에서 `--dry-run=server --validate=strict` 성공.
  아직 `todo` namespace가 없어 검증용 사본의 namespaced 리소스만 `default`로 바꾸어 검사했습니다.
  원본 namespace는 `todo`이며 Namespace 리소스도 dry-run으로 검사했습니다. 실제 생성은 없습니다.
- Service selector/대상 포트, Web API 주소, DB DNS, 원본 SQL과 사본 일치 확인.
- Secret 입력 스크립트 `bash -n` 및 `git diff --check` 통과.
- 클러스터 `standard` StorageClass 확인. IngressClass는 현재 없습니다.
- 이미지 빌드·로드, Secret 생성, 실제 배포, HTTP/CRUD 및 재시작 후 데이터 유지 검사는 미실행입니다.
  서버 dry-run은 이미지 존재, Secret 존재, 런타임 연결 성공을 검증하지 않습니다.
