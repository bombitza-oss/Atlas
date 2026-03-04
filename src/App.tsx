import { useState, useRef, useEffect } from "react";

interface Message { role: string; content: string; }

const SYSTEM_PROMPT = `Esti Atlas, antrenorul personal al Alexandrei. Raspunzi INTOTDEAUNA in limba romana. Esti motivant, direct, bazat pe stiinta, prietenos.

PROFILUL ALEXANDREI (Tanita MC-780, 3 martie 2026):
- Varsta: 37 ani | Inaltime: 170cm | Greutate: 58kg | BMI: 20.1
- Masa musculara: 43.7kg | Grasime: 20.7% | Grasime viscerala: nivel 2 (excelent)
- Varsta metabolica: 22 ani | BMR: 1352 kcal | Phase angle: 6.0
- Brate: 2.1kg/brat (potential mare!) | Picioare: 7.1kg + 6.9kg | Trunchi: 25.5kg

LIMITARI (respecta intotdeauna!):
- Hernie lombara L4-L5 si L5-S1: evita compresie axiala mare, hiperextensie lombara
- Genunchi afectati: evita impact puternic, genuflexiuni adanci cu greutati mari
- OK: Romanian deadlift, trap bar deadlift, core bracing, exercitii moderate

OBIECTIVE: Masa musculara, hanging/tractiuni, farmer carry, pregatire tenis + snowboard
PROGRAM: 3x/saptamana sala, 30-45 minute, split upper/lower body, nivel intermediar-avansat`;

const MOTIVATION_PROMPTS = [
  "Doza de motivație pentru azi 🔥",
  "Nu am chef de sală. Convinge-mă.",
  "Am terminat antrenamentul. Ce îmi spui?",
  "Progresez lent la hanging. Ajutor.",
  "De ce merită când nu văd rezultate?",
];

const stats = [
  { label: "Vârsta metabolică", value: "22 ani", color: "#22c55e", icon: "⚡" },
  { label: "Masă musculară", value: "43.7 kg", color: "#3b82f6", icon: "💪" },
  { label: "Grăsime corporală", value: "20.7%", color: "#f59e0b", icon: "📊" },
  { label: "Grăsime viscerală", value: "Nivel 2", color: "#22c55e", icon: "❤️" },
  { label: "BMR", value: "1352 kcal", color: "#8b5cf6", icon: "🔥" },
  { label: "Phase angle", value: "6.0°", color: "#06b6d4", icon: "🧬" },
];

const quickQuestions = [
  "Fă-mi un plan săptămânal",
  "Cum îmbunătățesc hanging-ul?",
  "Ce mănânc pentru masă musculară?",
  "Exerciții safe pentru hernie lombară",
  "Plan farmer's carry progresiv",
  "Cum mă pregătesc pentru ski season?",
];

const callAPI = async (systemPrompt: string, userMessage: string, maxTokens: number = 1000): Promise<string> => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userMessage }] }),
  });
  const data = await res.json();
  return data.content.map((i: { type: string; text?: string }) => i.type === "text" ? i.text : "").filter(Boolean).join("\n");
};

export default function Atlas() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [workout, setWorkout] = useState<string>("");
  const [workoutLoading, setWorkoutLoading] = useState<boolean>(false);
  const [workoutType, setWorkoutType] = useState<string>("");
  const [motivation, setMotivation] = useState<string>("");
  const [motivationLoading, setMotivationLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput(""); setShowWelcome(false);
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: newMessages }),
      });
      const data = await res.json();
      const reply: string = data.content.map((i: { type: string; text?: string }) => i.type === "text" ? i.text : "").filter(Boolean).join("\n");
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch { setMessages([...newMessages, { role: "assistant", content: "Eroare. Incearca din nou." }]); }
    finally { setLoading(false); }
  };

  const generateWorkout = async (type: string) => {
    setWorkoutType(type); setWorkout(""); setWorkoutLoading(true);
    try {
      const prompt = `Genereaza un antrenament de tip ${type} pentru Alexandra pentru azi. 
Format:
FOCUSUL DE AZI: [1 propozitie]
DURATA: [X minute]

INCALZIRE (5 min):
• [exercitiu] - [timp]
• [exercitiu] - [timp]

ANTRENAMENT PRINCIPAL:
1. [Exercitiu]
   Sets: X | Reps: X-X | Rest: Xs
   Nota: [indicatie tehnica / modificare pentru limitari]

[4-5 exercitii]

FINISHER:
• [exercitiu scurt - optional]

STRETCHING (5 min):
• [zona] - [durata]

SFATUL ZILEI: [motivatie scurta]`;
      const reply = await callAPI(SYSTEM_PROMPT, prompt, 1500);
      setWorkout(reply);
    } catch { setWorkout("Eroare. Incearca din nou."); }
    finally { setWorkoutLoading(false); }
  };

  const generateMotivation = async (prompt: string) => {
    setMotivation(""); setMotivationLoading(true);
    try {
      const reply = await callAPI(SYSTEM_PROMPT, prompt, 400);
      setMotivation(reply);
    } catch { setMotivation("Eroare. Incearca din nou."); }
    finally { setMotivationLoading(false); }
  };

  const G = "#22c55e";
  const tabs = [
    { id: "chat", label: "💬 Chat" },
    { id: "antrenament", label: "🏋️ Azi" },
    { id: "motivatie", label: "🔥 Motivație" },
    { id: "profil", label: "📋 Profil" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0a", fontFamily: "Georgia, serif", color: "#e8e8e0", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 24px 0", background: "linear-gradient(180deg,#0f1a0f,#0a0f0a)", borderBottom: "1px solid rgba(74,222,128,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#22c55e,#15803d)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🏋️</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: G }}>Atlas</div>
            <div style={{ fontSize: "10px", color: "#4a5568", letterSpacing: "1.5px", textTransform: "uppercase" as const }}>Antrenor Personal · Alexandra</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" as const }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", color: G }}>58.0 kg</div>
            <div style={{ fontSize: "11px", color: "#4a5568" }}>Vârsta metabolică: 22 ani ⚡</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "7px 12px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" as const, background: activeTab === tab.id ? "rgba(34,197,94,0.12)" : "transparent", color: activeTab === tab.id ? G : "#4a5568", borderBottom: activeTab === tab.id ? `2px solid ${G}` : "2px solid transparent" }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ANTRENAMENT */}
      {activeTab === "antrenament" && (
        <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            {!workout && !workoutLoading && (
              <div style={{ textAlign: "center" as const, padding: "40px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏋️</div>
                <div style={{ fontSize: "18px", color: G, fontWeight: "bold", marginBottom: "8px" }}>Ce facem azi, Alexandra?</div>
                <div style={{ fontSize: "13px", color: "#4a5568", marginBottom: "32px" }}>Alege tipul de antrenament și Atlas îți generează sesiunea completă.</div>
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" as const }}>
                  {[
                    { type: "Upper Body", icon: "💪", color: "#3b82f6", desc: "Spate, piept, brațe, umeri" },
                    { type: "Lower Body", icon: "🦵", color: "#22c55e", desc: "Picioare, glute, core" },
                    { type: "Full Body", icon: "⚡", color: "#f59e0b", desc: "Tot corpul, 45 min" },
                  ].map(w => (
                    <button key={w.type} onClick={() => generateWorkout(w.type)}
                      style={{ background: `${w.color}18`, border: `2px solid ${w.color}44`, color: w.color, padding: "20px 28px", borderRadius: "16px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia, serif" }}>
                      {w.icon} {w.type}<br/><span style={{ fontSize: "11px", color: "#4a5568", display: "block", marginTop: "4px" }}>{w.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {workoutLoading && (
              <div style={{ textAlign: "center" as const, padding: "60px 20px" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
                <div style={{ fontSize: "14px", color: G, marginBottom: "16px" }}>Atlas pregătește antrenamentul tău de {workoutType}...</div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: G, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            )}
            {workout && !workoutLoading && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", color: G, fontWeight: "bold" }}>🏋️ {workoutType} — Azi</div>
                  <button onClick={() => { setWorkout(""); setWorkoutType(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#4a5568", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "11px" }}>↩ Alt antrenament</button>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "14px", padding: "20px", whiteSpace: "pre-wrap" as const, fontSize: "13px", lineHeight: "1.9", color: "#d1d5db" }}>{workout}</div>
                <button onClick={() => { setActiveTab("chat"); sendMessage(`Am terminat antrenamentul de ${workoutType}. Ce imi recomanzi pentru recuperare?`); }}
                  style={{ marginTop: "12px", width: "100%", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: G, padding: "12px", borderRadius: "12px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia, serif" }}>
                  Am terminat! Ce fac pentru recuperare? →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOTIVATIE */}
      {activeTab === "motivatie" && (
        <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "24px" }}>
              {MOTIVATION_PROMPTS.map(p => (
                <button key={p} onClick={() => generateMotivation(p)} style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontFamily: "Georgia, serif" }}>{p}</button>
              ))}
              <button onClick={() => generateMotivation("Surprinde-ma cu ceva motivational puternic si neasteptat, specific pentru profilul meu.")}
                style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(245,158,11,0.15))", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", padding: "8px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontFamily: "Georgia, serif" }}>🔥 Surprinde-mă!</button>
            </div>
            {motivationLoading && (
              <div style={{ textAlign: "center" as const, padding: "40px" }}>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            )}
            {motivation && !motivationLoading && (
              <div style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.06),rgba(245,158,11,0.06))", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔥</div>
                <div style={{ fontSize: "14px", lineHeight: "1.9", whiteSpace: "pre-wrap" as const }}>{motivation}</div>
              </div>
            )}
            {!motivation && !motivationLoading && (
              <div style={{ textAlign: "center" as const, padding: "40px 20px", color: "#2a3a2a" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔥</div>
                <div style={{ fontSize: "14px" }}>Alege o situație sau apasă Surprinde-mă</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFIL */}
      {activeTab === "profil" && (
        <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px", marginBottom: "16px" }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}22`, borderRadius: "12px", padding: "14px" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{s.icon}</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#4a5568" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "bold", marginBottom: "6px" }}>⚠️ Limitări fizice</div>
              <div style={{ fontSize: "12px", color: "#9a6a6a" }}>Hernie lombară L4-L5 și L5-S1 · Genunchi afectați</div>
            </div>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: G, fontWeight: "bold", marginBottom: "6px" }}>🎯 Obiective</div>
              <div style={{ fontSize: "12px", color: "#6b8a6b", lineHeight: "1.8" }}>💪 Masă musculară · 🤸 Hanging · 🏋️ Farmer's carry · 🎾 Tenis · 🏂 Snowboard</div>
            </div>
            <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "14px" }}>
              <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "bold", marginBottom: "10px" }}>💪 Distribuție masă musculară</div>
              {[{ zona: "Trunchi", val: 25.5, max: 30 }, { zona: "Picior drept", val: 7.1, max: 10 }, { zona: "Picior stâng", val: 6.9, max: 10 }, { zona: "Braț drept", val: 2.1, max: 5 }, { zona: "Braț stâng", val: 2.1, max: 5 }].map(s => (
                <div key={s.zona} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#4a5568", marginBottom: "3px" }}>
                    <span>{s.zona}</span><span style={{ color: "#3b82f6" }}>{s.val} kg</span>
                  </div>
                  <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${(s.val / s.max) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#1d4ed8)", borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "8px" }}>💡 Brațele au cel mai mare potențial — perfect pentru hanging.</div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT */}
      {activeTab === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" as const }}>
            {showWelcome && (
              <div style={{ padding: "24px 0 20px" }}>
                <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "14px", padding: "18px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "14px", color: G, marginBottom: "8px", fontWeight: "bold" }}>🏋️ Salut Alexandra! Sunt Atlas, antrenorul tău.</div>
                  <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.7" }}>Vârsta metabolică <strong style={{ color: G }}>22 de ani</strong> la 37 e excepțional. Ai o bază solidă — hai să construim pe ea. 💪 Știu de hernia lombară și genunchi.</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                  {quickQuestions.map(q => (
                    <button key={q} onClick={() => sendMessage(q)} style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#16a34a", padding: "7px 13px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "14px" }}>
                {msg.role === "assistant" && <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", marginRight: "8px", flexShrink: 0, marginTop: "4px" }}>🏋️</div>}
                <div style={{ maxWidth: "80%", padding: "11px 15px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg,#22c55e,#15803d)" : "rgba(255,255,255,0.04)", border: msg.role === "assistant" ? "1px solid rgba(34,197,94,0.12)" : "none", color: msg.role === "user" ? "#0a0f0a" : "#e8e8e0", fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const }}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>🏋️</div>
                <div style={{ padding: "11px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "4px 18px 18px 18px", display: "flex", gap: "4px" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: G, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "10px 20px 18px", borderTop: "1px solid rgba(34,197,94,0.08)", background: "#0a0f0a", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" as const }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "14px", padding: "10px 14px" }}>
              <textarea value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                placeholder="Intreaba-l pe Atlas orice..."
                rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8e8e0", fontSize: "13px", lineHeight: "1.5", resize: "none" as const, fontFamily: "Georgia, serif", maxHeight: "100px", overflowY: "auto" as const }} />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width: "32px", height: "32px", borderRadius: "10px", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", background: loading || !input.trim() ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>↑</button>
            </div>
            <p style={{ textAlign: "center" as const, fontSize: "10px", color: "#1e2535", marginTop: "6px" }}>Nu inlocuieste sfatul unui medic sau kinetoterapeut</p>
          </div>
        </>
      )}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(34,197,94,0.15);border-radius:2px}`}</style>
    </div>
  );
}
