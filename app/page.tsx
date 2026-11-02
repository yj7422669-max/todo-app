"use client";

import { type FormEvent, useEffect, useState } from "react";

type DesignKey = "minimal" | "pastel" | "dark";
type Todo = { id: string; text: string; completed: boolean };

const designs: { id: DesignKey; number: string; name: string; mood: string; description: string }[] = [
  { id: "minimal", number: "01", name: "미니멀", mood: "FOCUS ON WHAT MATTERS", description: "정돈된 여백과 선명한 대비로 할 일에 집중해요." },
  { id: "pastel", number: "02", name: "파스텔", mood: "A LITTLE JOY, EVERY DAY", description: "부드러운 색감과 둥근 카드로 기분 좋게 시작해요." },
  { id: "dark", number: "03", name: "다크모드", mood: "MAKE SPACE TO THINK", description: "차분한 어두운 배경으로 밤에도 편안하게 써요." },
];

const API_URL = "http://localhost:4000";
const DESIGN_KEY = "todo-app-design-v1";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<DesignKey | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);


useEffect(() => {
  async function loadTodos() {
    try {
      // PostgreSQL에 저장된 할 일 가져오기
      const response = await fetch(`${API_URL}/api/todos`);

      if (!response.ok) {
        throw new Error("할 일 조회 실패");
      }

      const data: Todo[] = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("할 일을 불러오지 못했습니다:", error);
    } finally {
      setIsLoaded(true);
    }
  }

  // 선택한 디자인은 기존처럼 브라우저에 저장
  try {
    const savedDesign = localStorage.getItem(DESIGN_KEY);

    if (savedDesign && designs.some((design) => design.id === savedDesign)) {
      setSelectedDesign(savedDesign as DesignKey);
    }
  } catch {
    console.error("디자인 설정을 불러오지 못했습니다.");
  }

  loadTodos();
}, []);


useEffect(() => {
  if (!isLoaded || !selectedDesign) return;

  try {
    localStorage.setItem(DESIGN_KEY, selectedDesign);
  } catch {
    console.error("디자인 설정 저장 실패");
  }
}, [selectedDesign, isLoaded]);


async function addTodo(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const text = newTodo.trim();
  if (!text) return;

  try {
    const response = await fetch(`${API_URL}/api/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("할 일 추가 실패");
    }

    const savedTodo: Todo = await response.json();

    setTodos((current) => [savedTodo, ...current]);
    setNewTodo("");
  } catch (error) {
    console.error("할 일 추가 오류:", error);
    alert("할 일을 추가하지 못했습니다.");
  }
}


 
async function toggleTodo(id: string) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;

  try {
    const response = await fetch(`${API_URL}/api/todos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: !todo.completed,
      }),
    });

    if (!response.ok) {
      throw new Error("완료 상태 변경 실패");
    }

    const updatedTodo: Todo = await response.json();

    setTodos((current) =>
      current.map((item) =>
        item.id === id ? updatedTodo : item
      )
    );
  } catch (error) {
    console.error("완료 상태 변경 오류:", error);
    alert("완료 상태를 변경하지 못했습니다.");
  }
}



async function deleteTodo(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/todos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("할 일 삭제 실패");
    }

    setTodos((current) =>
      current.filter((todo) => todo.id !== id)
    );
  } catch (error) {
    console.error("할 일 삭제 오류:", error);
    alert("할 일을 삭제하지 못했습니다.");
  }
}


  const remaining = todos.filter((todo) => !todo.completed).length;

  return (
    <main className="showcase-page">
      <header className="showcase-header">
        <a className="wordmark" href="#top" aria-label="오늘의 할 일 홈"><span className="wordmark-mark">t.</span> taskday</a>
        <span className="header-note">A SMALL SPACE FOR YOUR DAY</span>
      </header>

      <section className="intro" id="top">
        <p className="intro-kicker"><span /> YOUR DAY, YOUR WAY</p>
        <h1>어떤 하루를<br className="mobile-break" /> 만들어 볼까요?</h1>
        <p className="intro-copy">마음에 드는 디자인을 골라 할 일을 정리해 보세요.<br className="desktop-break" /> 선택한 디자인은 다음에 다시 방문해도 기억할게요.</p>
      </section>

      <section className="design-section" aria-labelledby="design-title">
        <div className="section-heading">
          <div><p className="section-label">CHOOSE YOUR STYLE</p><h2 id="design-title">세 가지 디자인 시안</h2></div>
          <span className="section-aside">01 — 03</span>
        </div>

        <div className="design-grid">
          {designs.map((design) => (
            <article className={`design-card ${selectedDesign === design.id ? "is-selected" : ""}`} key={design.id}>
              <div className={`preview preview-${design.id}`} aria-hidden="true">
                {design.id === "minimal" && (
                  <div className="mock-window mock-minimal">
                    <div className="minimal-top"><span>MONDAY, OCTOBER 30</span><span>☼ &nbsp; 18°</span></div>
                    <div className="minimal-title">오늘 해야 할 일<span>03</span></div>
                    <div className="minimal-rule" />
                    <div className="minimal-task is-done"><i>✓</i><span>아침 산책하기</span><b>완료</b></div>
                    <div className="minimal-task"><i /><span>책 10페이지 읽기</span><b>개인</b></div>
                    <div className="minimal-task"><i /><span>물 한 잔 마시기</span><b>건강</b></div>
                    <div className="minimal-add">＋ &nbsp; 새로운 할 일</div>
                  </div>
                )}
                {design.id === "pastel" && (
                  <div className="mock-window mock-pastel">
                    <div className="pastel-greeting"><span>좋은 아침이에요,</span><b>오늘도 반짝이는 하루! <i>✳</i></b><small>10월 30일 월요일</small></div>
                    <div className="pastel-progress"><span>오늘의 작은 목표</span><b>1 / 3</b><i><em /></i></div>
                    <div className="pastel-task"><i className="pink-check">✓</i><span><b>아침 산책하기</b><small>나를 위한 시간</small></span><s>완료</s></div>
                    <div className="pastel-task"><i className="lav-check" /><span><b>책 10페이지 읽기</b><small>차 한 잔과 함께</small></span><s>09:30</s></div>
                  </div>
                )}
                {design.id === "dark" && (
                  <div className="mock-window mock-dark">
                    <aside><b>t.</b><i>⌂</i><i>▤</i><i>◷</i></aside>
                    <div className="dark-content"><div className="dark-bar"><span>MONDAY / OCT 30</span><i>◐</i></div><b className="dark-title">오늘의 집중</b><small>작은 진전도 진전이에요.</small>
                      <div className="dark-focus"><i>✳</i><span><b>03</b><small>TASKS LEFT</small></span><em>↗</em></div>
                      <div className="dark-task done"><i>✓</i><span>아침 산책하기</span></div><div className="dark-task"><i /><span>책 10페이지 읽기</span></div><div className="dark-task"><i /><span>물 한 잔 마시기</span></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="design-info">
                <div className="design-name-line"><span className="design-number">{design.number}</span><h3>{design.name}</h3><span className={`swatch swatch-${design.id}`} /></div>
                <p className="design-mood">{design.mood}</p>
                <p className="design-description">{design.description}</p>
                <button
                  className={`select-button ${selectedDesign === design.id ? "selected-button" : ""}`}
                  type="button"
                  onClick={() => setSelectedDesign(design.id)}
                  aria-pressed={selectedDesign === design.id}
                >
                  {selectedDesign === design.id ? "선택됨" : "이 디자인 선택하기"}
                  <span aria-hidden="true">{selectedDesign === design.id ? "✓" : "↗"}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedDesign ? (
        <section className={`workspace workspace-${selectedDesign}`} aria-labelledby="workspace-title">
          <div className="workspace-heading">
            <div><p className="section-label">YOUR SELECTED DESIGN</p><h2 id="workspace-title">내 할 일</h2></div>
            <button className="change-design" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>시안 다시 고르기 <span aria-hidden="true">↑</span></button>
          </div>
          <div className="workspace-body">
            {selectedDesign === "dark" && (
              <aside className="focus-summary" aria-label="오늘의 할 일 요약">
                <span className="focus-symbol" aria-hidden="true">◐</span>
                <p className="section-label">TODAY’S FOCUS</p>
                <h3>오늘의 집중</h3>
                <strong>{String(remaining).padStart(2, "0")}</strong>
                <span className="focus-caption">남은 할 일</span>
                <p className="focus-note">작은 진전도<br />진전이에요.</p>
                <div className="focus-total">완료 <b>{todos.length - remaining} / {todos.length}</b></div>
              </aside>
            )}
          <div className="todo-panel">
            <div className="todo-panel-top"><div><span className="today-label">TODAY · {new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</span><p className="todo-greeting">{selectedDesign === "minimal" ? "오늘 해야 할 일." : selectedDesign === "pastel" ? "오늘도 반짝이는 하루!" : "하나씩, 차분하게."}</p></div><span className="progress-badge">{remaining}개 남음</span></div>
            {selectedDesign === "pastel" && (
              <div className="daily-progress">
                <div><span>오늘의 작은 성취 <span aria-hidden="true">✳</span></span><b>{todos.length === 0 ? 0 : Math.round((todos.length - remaining) / todos.length * 100)}%</b></div>
                <progress aria-label="할 일 완료율" value={todos.length - remaining} max={todos.length || 1} />
              </div>
            )}
            <form className="todo-form" onSubmit={addTodo}>
              <label className="visually-hidden" htmlFor="new-todo">새 할 일</label>
              <input id="new-todo" value={newTodo} onChange={(event) => setNewTodo(event.target.value)} placeholder="새로운 할 일을 입력하세요" maxLength={200} autoComplete="off" />
              <button type="submit">추가 <span aria-hidden="true">＋</span></button>
            </form>
            {todos.length === 0 ? (
              <div className="todo-empty"><span aria-hidden="true">✳</span><p>{isLoaded ? "아직 등록한 할 일이 없어요." : "할 일을 불러오는 중이에요."}</p><small>작은 일부터 적어 볼까요?</small></div>
            ) : (
              <ul className="todo-list">
                {todos.map((todo, index) => (
                  <li className={`todo-item ${todo.completed ? "is-completed" : ""}`} key={todo.id}>
                    {selectedDesign === "minimal" && <span className="task-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
                    <button className="check-button" type="button" onClick={() => toggleTodo(todo.id)} aria-label={todo.completed ? `${todo.text} 완료 취소` : `${todo.text} 완료 표시`} aria-pressed={todo.completed}>{todo.completed && <span aria-hidden="true">✓</span>}</button>
                    <span className="todo-text">{todo.text}</span>
                    <button className="delete-button" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`${todo.text} 삭제`}><svg viewBox="0 0 20 20" aria-hidden="true" fill="none"><path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6M8.5 9v4m3-4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="todo-panel-footer"><span><i /> 이 브라우저에 자동 저장돼요</span><span>{todos.length - remaining} / {todos.length} 완료</span></div>
          </div>
          </div>
        </section>
      ) : (
        <p className="selection-hint">마음에 드는 카드의 버튼을 눌러 시작해 보세요.</p>
      )}

      <footer className="site-footer"><span>taskday © 2026</span><span>오늘의 작은 성취를 응원해요.</span></footer>
    </main>
  );
}
