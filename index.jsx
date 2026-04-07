import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "servicios", label: "Servicios", icon: "💡", color: "#3B82F6" },
  { id: "impuestos", label: "Impuestos", icon: "🏛️", color: "#8B5CF6" },
  { id: "tarjetas", label: "Tarjetas", icon: "💳", color: "#EC4899" },
  { id: "expensas", label: "Expensas / Alquiler", icon: "🏠", color: "#F59E0B" },
  { id: "otros", label: "Otros", icon: "📌", color: "#6B7280" },
];

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ABBR = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

function getUrgency(dueDay, year, month) {
  const today = new Date();
  const due = new Date(year, month, dueDay);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "vencido";
  if (diff <= 3) return "urgente";
  if (diff <= 7) return "proximo";
  return "ok";
}

const URGENCY_STYLES = {
  vencido: { bg: "#FEE2E2", border: "#EF4444", badge: "#EF4444", label: "Vencido" },
  urgente: { bg: "#FEF3C7", border: "#F59E0B", badge: "#F59E0B", label: "Urgente" },
  proximo: { bg: "#DBEAFE", border: "#3B82F6", badge: "#3B82F6", label: "Próximo" },
  ok:      { bg: "#F0FDF4", border: "#22C55E", badge: "#22C55E", label: "A tiempo" },
};

function genId() { return Math.random().toString(36).slice(2, 10); }

const DEFAULT_PAYMENTS = [
  { id: genId(), name: "Luz (EPEC)", category: "servicios", dueDay: 10, amount: "", paid: false },
  { id: genId(), name: "Gas (Naturgy)", category: "servicios", dueDay: 15, amount: "", paid: false },
  { id: genId(), name: "Internet", category: "servicios", dueDay: 5, amount: "", paid: false },
  { id: genId(), name: "ARBA / AFIP", category: "impuestos", dueDay: 20, amount: "", paid: false },
  { id: genId(), name: "Tarjeta Visa", category: "tarjetas", dueDay: 12, amount: "", paid: false },
  { id: genId(), name: "Expensas", category: "expensas", dueDay: 1, amount: "", paid: false },
];

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"flex-end" }}>
      <div style={{ background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto",padding:"24px 20px 32px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <span style={{ fontWeight:700,fontSize:18 }}>{title}</span>
          <button onClick={onClose} style={{ background:"#F3F4F6",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Payment Form ─────────────────────────────────────────────────────────────
function PaymentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name:"", category:"servicios", dueDay:10, amount:"" });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div>
        <label style={labelStyle}>Nombre del pago</label>
        <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej: Luz EPEC" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Categoría</label>
        <select value={form.category} onChange={e=>set("category",e.target.value)} style={inputStyle}>
          {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Día de vencimiento</label>
        <input type="number" min={1} max={31} value={form.dueDay} onChange={e=>set("dueDay",parseInt(e.target.value)||1)} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Monto estimado (opcional)</label>
        <input value={form.amount} onChange={e=>set("amount",e.target.value)} placeholder="$0" style={inputStyle} />
      </div>
      <button onClick={()=>onSave(form)} style={btnPrimary}>Guardar</button>
    </div>
  );
}

const labelStyle = { display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6 };
const inputStyle = { width:"100%",padding:"10px 12px",border:"1.5px solid #E5E7EB",borderRadius:10,fontSize:15,outline:"none",boxSizing:"border-box",background:"#F9FAFB" };
const btnPrimary = { background:"#1D4ED8",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%" };

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ payments, year, month, onDayClick }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const payByDay = {};
  payments.forEach(p => {
    if (!payByDay[p.dueDay]) payByDay[p.dueDay] = [];
    payByDay[p.dueDay].push(p);
  });

  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4 }}>
        {DAYS_ABBR.map(d=><div key={d} style={{ textAlign:"center",fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
        {cells.map((d,i) => {
          if (!d) return <div key={i} />;
          const pays = payByDay[d] || [];
          const urgencies = pays.map(p => p.paid ? "ok" : getUrgency(p.dueDay, year, month));
          const topUrgency = urgencies.includes("vencido") ? "vencido"
            : urgencies.includes("urgente") ? "urgente"
            : urgencies.includes("proximo") ? "proximo"
            : urgencies.includes("ok") ? "ok" : null;
          const style = topUrgency ? URGENCY_STYLES[topUrgency] : null;
          return (
            <div key={i} onClick={() => pays.length && onDayClick(d)} style={{
              borderRadius:8,padding:"6px 4px",minHeight:44,textAlign:"center",cursor:pays.length?"pointer":"default",
              background: pays.length ? style.bg : "#F9FAFB",
              border: isToday(d) ? "2px solid #1D4ED8" : pays.length ? `1.5px solid ${style.border}` : "1.5px solid #F3F4F6",
            }}>
              <div style={{ fontSize:13,fontWeight:isToday(d)?800:500,color:isToday(d)?"#1D4ED8":"#374151" }}>{d}</div>
              {pays.length > 0 && (
                <div style={{ marginTop:2 }}>
                  {pays.slice(0,2).map(p=>{
                    const u = p.paid ? "ok" : getUrgency(p.dueDay,year,month);
                    return <div key={p.id} style={{ width:6,height:6,borderRadius:"50%",background:URGENCY_STYLES[u].badge,margin:"1px auto" }} />;
                  })}
                  {pays.length > 2 && <div style={{ fontSize:9,color:"#6B7280" }}>+{pays.length-2}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [allData, setAllData] = useState(null); // { "2025-4": [...payments] }
  const [tab, setTab] = useState("lista"); // lista | calendario
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "day" | "whatsapp"
  const [editTarget, setEditTarget] = useState(null);
  const [dayTarget, setDayTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");

  const storageKey = `pagos-${viewYear}-${viewMonth}`;

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await window.storage.get(storageKey);
        if (res && res.value) {
          setAllData(JSON.parse(res.value));
        } else {
          // First time this month: clone from previous or use defaults
          const prevKey = `pagos-${viewMonth === 0 ? viewYear-1 : viewYear}-${viewMonth === 0 ? 11 : viewMonth-1}`;
          try {
            const prev = await window.storage.get(prevKey);
            if (prev && prev.value) {
              const prevData = JSON.parse(prev.value);
              const fresh = prevData.map(p => ({ ...p, paid: false, amount: p.amount }));
              setAllData(fresh);
            } else {
              setAllData(DEFAULT_PAYMENTS.map(p=>({...p,id:genId()})));
            }
          } catch { setAllData(DEFAULT_PAYMENTS.map(p=>({...p,id:genId()}))); }
        }
      } catch { setAllData(DEFAULT_PAYMENTS.map(p=>({...p,id:genId()}))); }
      setLoading(false);
    }
    load();
  }, [viewMonth, viewYear]);

  // Save data
  const save = useCallback(async (data) => {
    setAllData(data);
    try { await window.storage.set(storageKey, JSON.stringify(data)); } catch {}
  }, [storageKey]);

  const payments = allData || [];

  const togglePaid = (id) => {
    save(payments.map(p => p.id === id ? {...p, paid: !p.paid} : p));
  };

  const updateAmount = (id, amount) => {
    save(payments.map(p => p.id === id ? {...p, amount} : p));
  };

  const addPayment = (form) => {
    save([...payments, { ...form, id: genId(), paid: false }]);
    setModal(null);
  };

  const editPayment = (form) => {
    save(payments.map(p => p.id === editTarget.id ? {...p, ...form} : p));
    setModal(null); setEditTarget(null);
  };

  const deletePayment = (id) => {
    save(payments.filter(p => p.id !== id));
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); }
    else setViewMonth(m=>m-1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); }
    else setViewMonth(m=>m+1);
  };

  const filtered = filterCat === "all" ? payments : payments.filter(p=>p.category===filterCat);
  const sorted = [...filtered].sort((a,b) => a.dueDay - b.dueDay);

  const totalMes = payments.reduce((acc,p) => acc + (parseFloat(p.amount)||0), 0);
  const totalPagado = payments.filter(p=>p.paid).reduce((acc,p) => acc + (parseFloat(p.amount)||0), 0);
  const pendientes = payments.filter(p=>!p.paid);

  // WhatsApp message
  const buildWhatsApp = () => {
    const prox = payments
      .filter(p => !p.paid)
      .filter(p => {
        const u = getUrgency(p.dueDay, viewYear, viewMonth);
        return u === "urgente" || u === "proximo" || u === "vencido";
      })
      .sort((a,b)=>a.dueDay-b.dueDay);
    if (!prox.length) return "No tenés pagos urgentes este mes 🎉";
    let msg = `📋 *Pagos pendientes - ${MONTHS[viewMonth]} ${viewYear}*\n\n`;
    prox.forEach(p => {
      const u = getUrgency(p.dueDay, viewYear, viewMonth);
      const emoji = u==="vencido"?"🔴":u==="urgente"?"🟡":"🔵";
      msg += `${emoji} ${p.name} — vence el día ${p.dueDay}`;
      if (p.amount) msg += ` — $${p.amount}`;
      msg += `\n`;
    });
    msg += `\n💰 Total pendiente: $${pendientes.reduce((a,p)=>a+(parseFloat(p.amount)||0),0).toLocaleString("es-AR")}`;
    return msg;
  };

  // Export PDF
  const exportPDF = () => {
    const rows = sorted.map(p => {
      const u = p.paid ? "✅ Pagado" : URGENCY_STYLES[getUrgency(p.dueDay,viewYear,viewMonth)].label;
      return `<tr><td>${p.dueDay}</td><td>${p.name}</td><td>${CATEGORIES.find(c=>c.id===p.category)?.label}</td><td>${p.amount?`$${p.amount}`:"-"}</td><td>${u}</td></tr>`;
    }).join("");
    const html = `<html><head><meta charset="utf-8"><title>Pagos ${MONTHS[viewMonth]} ${viewYear}</title>
    <style>body{font-family:Arial;padding:20px}h2{color:#1D4ED8}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#EFF6FF;color:#1D4ED8}tr:nth-child(even){background:#F9FAFB}.total{margin-top:16px;font-weight:bold;font-size:16px}</style>
    </head><body><h2>💳 Pagos de ${MONTHS[viewMonth]} ${viewYear}</h2>
    <table><thead><tr><th>Día</th><th>Nombre</th><th>Categoría</th><th>Monto</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">💰 Total mes: $${totalMes.toLocaleString("es-AR")} &nbsp;|&nbsp; ✅ Pagado: $${totalPagado.toLocaleString("es-AR")} &nbsp;|&nbsp; ⏳ Pendiente: $${(totalMes-totalPagado).toLocaleString("es-AR")}</div>
    </body></html>`;
    const w = window.open("","_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(),500);
  };

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12 }}>
      <div style={{ width:36,height:36,border:"3px solid #DBEAFE",borderTop:"3px solid #1D4ED8",borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:"#6B7280",fontSize:14 }}>Cargando pagos...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F3F4F6",minHeight:"100vh",maxWidth:480,margin:"0 auto" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #1D4ED8 !important; outline: none; }
      `}</style>

      {/* Header */}
      <div style={{ background:"#1D4ED8",padding:"20px 20px 24px",color:"#fff" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:18,fontWeight:800 }}>💳 Mis Pagos</span>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>setModal("whatsapp")} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"7px 10px",color:"#fff",cursor:"pointer",fontSize:16 }}>📲</button>
            <button onClick={exportPDF} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"7px 10px",color:"#fff",cursor:"pointer",fontSize:16 }}>📄</button>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <button onClick={prevMonth} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:18 }}>‹</button>
          <span style={{ fontWeight:700,fontSize:17 }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:18 }}>›</button>
        </div>

        {/* Summary */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { label:"Total", value:`$${totalMes.toLocaleString("es-AR")}`, sub:"del mes" },
            { label:"Pagado", value:`$${totalPagado.toLocaleString("es-AR")}`, sub:`${payments.filter(p=>p.paid).length} pagos` },
            { label:"Pendiente", value:`$${(totalMes-totalPagado).toLocaleString("es-AR")}`, sub:`${pendientes.length} pagos` },
          ].map(s=>(
            <div key={s.label} style={{ background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 8px",textAlign:"center" }}>
              <div style={{ fontSize:11,opacity:0.8,marginBottom:2 }}>{s.label}</div>
              <div style={{ fontWeight:800,fontSize:14 }}>{s.value}</div>
              <div style={{ fontSize:10,opacity:0.7 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff",display:"flex",borderBottom:"1.5px solid #E5E7EB" }}>
        {[{id:"lista",label:"📋 Lista"},{id:"calendario",label:"📅 Calendario"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"12px 0",border:"none",background:"transparent",fontWeight:600,fontSize:14,
            color:tab===t.id?"#1D4ED8":"#9CA3AF",
            borderBottom:tab===t.id?"2.5px solid #1D4ED8":"2.5px solid transparent",cursor:"pointer"
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:"16px 16px 80px" }}>

        {/* Category filter */}
        <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12 }}>
          <button onClick={()=>setFilterCat("all")} style={{ ...chipStyle, background:filterCat==="all"?"#1D4ED8":"#F3F4F6", color:filterCat==="all"?"#fff":"#374151" }}>Todos</button>
          {CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>setFilterCat(c.id)} style={{ ...chipStyle, background:filterCat===c.id?c.color:"#F3F4F6", color:filterCat===c.id?"#fff":"#374151", whiteSpace:"nowrap" }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {tab === "lista" && (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {sorted.length === 0 && (
              <div style={{ textAlign:"center",padding:40,color:"#9CA3AF" }}>
                <div style={{ fontSize:40,marginBottom:8 }}>🎉</div>
                No hay pagos en esta categoría
              </div>
            )}
            {sorted.map(p => {
              const u = p.paid ? "ok" : getUrgency(p.dueDay, viewYear, viewMonth);
              const us = URGENCY_STYLES[u];
              const cat = CATEGORIES.find(c=>c.id===p.category);
              return (
                <div key={p.id} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${p.paid?"#E5E7EB":us.border}`,padding:"14px 14px",display:"flex",flexDirection:"column",gap:8 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:18 }}>{cat?.icon}</span>
                        <span style={{ fontWeight:700,fontSize:15,color:p.paid?"#9CA3AF":"#111827", textDecoration:p.paid?"line-through":"none" }}>{p.name}</span>
                      </div>
                      <div style={{ display:"flex",gap:8,marginTop:4,alignItems:"center" }}>
                        <span style={{ fontSize:12,color:"#6B7280" }}>Vence el día {p.dueDay}</span>
                        {!p.paid && (
                          <span style={{ fontSize:11,fontWeight:700,color:us.badge,background:us.bg,padding:"1px 8px",borderRadius:20 }}>{us.label}</span>
                        )}
                        {p.paid && <span style={{ fontSize:11,fontWeight:700,color:"#22C55E",background:"#F0FDF4",padding:"1px 8px",borderRadius:20 }}>✅ Pagado</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                      <input
                        value={p.amount}
                        onChange={e=>updateAmount(p.id,e.target.value)}
                        placeholder="$0"
                        style={{ width:90,padding:"5px 8px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:14,fontWeight:700,textAlign:"right",color:"#1D4ED8",background:"#F9FAFB" }}
                      />
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={()=>togglePaid(p.id)} style={{
                      flex:1,padding:"8px",borderRadius:10,border:"1.5px solid",fontSize:13,fontWeight:700,cursor:"pointer",
                      borderColor:p.paid?"#22C55E":"#E5E7EB",
                      background:p.paid?"#F0FDF4":"#F9FAFB",
                      color:p.paid?"#22C55E":"#374151"
                    }}>{p.paid?"✅ Pagado":"Marcar pagado"}</button>
                    <button onClick={()=>{setEditTarget(p);setModal("edit");}} style={{ padding:"8px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",background:"#F9FAFB",cursor:"pointer",fontSize:13 }}>✏️</button>
                    <button onClick={()=>deletePayment(p.id)} style={{ padding:"8px 12px",borderRadius:10,border:"1.5px solid #FEE2E2",background:"#FEF2F2",cursor:"pointer",fontSize:13 }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "calendario" && (
          <div style={{ background:"#fff",borderRadius:14,padding:16 }}>
            <CalendarView
              payments={filtered}
              year={viewYear}
              month={viewMonth}
              onDayClick={(d)=>{ setDayTarget(d); setModal("day"); }}
            />
            <div style={{ marginTop:16,display:"flex",gap:8,flexWrap:"wrap" }}>
              {Object.entries(URGENCY_STYLES).map(([k,v])=>(
                <div key={k} style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#374151" }}>
                  <div style={{ width:10,height:10,borderRadius:"50%",background:v.badge }} />
                  {v.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>setModal("add")} style={{ position:"fixed",bottom:24,right:20,width:56,height:56,borderRadius:"50%",background:"#1D4ED8",color:"#fff",border:"none",fontSize:28,cursor:"pointer",boxShadow:"0 4px 16px rgba(29,78,216,0.4)",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>

      {/* Modals */}
      {modal === "add" && (
        <Modal title="Nuevo pago" onClose={()=>setModal(null)}>
          <PaymentForm onSave={addPayment} onClose={()=>setModal(null)} />
        </Modal>
      )}
      {modal === "edit" && editTarget && (
        <Modal title="Editar pago" onClose={()=>{setModal(null);setEditTarget(null);}}>
          <PaymentForm initial={editTarget} onSave={editPayment} onClose={()=>{setModal(null);setEditTarget(null);}} />
        </Modal>
      )}
      {modal === "day" && dayTarget && (
        <Modal title={`Pagos del día ${dayTarget}`} onClose={()=>{setModal(null);setDayTarget(null);}}>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {payments.filter(p=>p.dueDay===dayTarget).map(p=>{
              const u = p.paid?"ok":getUrgency(p.dueDay,viewYear,viewMonth);
              const us = URGENCY_STYLES[u];
              const cat = CATEGORIES.find(c=>c.id===p.category);
              return (
                <div key={p.id} style={{ padding:14,borderRadius:12,border:`1.5px solid ${us.border}`,background:us.bg }}>
                  <div style={{ fontWeight:700 }}>{cat?.icon} {p.name}</div>
                  <div style={{ fontSize:13,color:"#6B7280",marginTop:2 }}>{p.amount?`$${p.amount}`:""} — <span style={{ color:us.badge,fontWeight:600 }}>{p.paid?"✅ Pagado":us.label}</span></div>
                  <button onClick={()=>togglePaid(p.id)} style={{ marginTop:10,padding:"7px 16px",borderRadius:8,border:"none",background:p.paid?"#E5E7EB":"#1D4ED8",color:p.paid?"#374151":"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>
                    {p.paid?"Desmarcar":"Marcar pagado"}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      {modal === "whatsapp" && (
        <Modal title="📲 Aviso por WhatsApp" onClose={()=>setModal(null)}>
          <div style={{ background:"#F0FDF4",borderRadius:12,padding:16,marginBottom:16,fontSize:14,whiteSpace:"pre-wrap",lineHeight:1.6,color:"#1F2937",border:"1.5px solid #BBF7D0" }}>
            {buildWhatsApp()}
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(buildWhatsApp())}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:"block",background:"#25D366",color:"#fff",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:"pointer",textAlign:"center",textDecoration:"none" }}
          >
            Abrir en WhatsApp
          </a>
        </Modal>
      )}
    </div>
  );
}

const chipStyle = { padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,fontWeight:600 };
