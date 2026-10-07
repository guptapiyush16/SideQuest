import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode, RefObject } from 'react'
import {
  ArrowUpRight,
  Bird,
  BookOpen,
  BrainCircuit,
  Camera,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Compass,
  Footprints,
  Flower2,
  Info,
  Leaf,
  LibraryBig,
  LocateFixed,
  MapPin,
  Mountain,
  Plus,
  RotateCcw,
  Route,
  ScanLine,
  Sparkles,
  Target,
  Trees,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Tab = 'today' | 'scan' | 'pokedex' | 'adventures' | 'profile'
type ScanState = 'idle' | 'result' | 'uncertain'

type Quest = {
  id: number
  icon: LucideIcon
  tone: string
  label: string
  title: string
  detail: string
  xp: number
  duration: string
  tag: string
}

type Discovery = {
  id: number
  icon: LucideIcon
  tone: string
  category: string
  name: string
  scientific: string
  place: string
  date: string
  rarity: string
}

type Outing = {
  date: string
  day: string
  distance: string
  duration: string
  discoveryCount: number
  questCount: number
  tone: string
}

const navItems: { id: Tab; label: string; icon: LucideIcon; key: string }[] = [
  { id: 'today', label: 'Today', icon: Compass, key: '01' },
  { id: 'scan', label: 'Scan', icon: ScanLine, key: '02' },
  { id: 'pokedex', label: 'Pokédex', icon: LibraryBig, key: '03' },
  { id: 'adventures', label: 'Adventures', icon: Route, key: '04' },
  { id: 'profile', label: 'Profile', icon: UserRound, key: '05' },
]

const quests: Quest[] = [
  {
    id: 1,
    icon: Leaf,
    tone: 'sage',
    label: 'NATURE SCOUT',
    title: 'Find one plant you can’t name yet',
    detail: 'Take a photo from a safe distance. No picking needed.',
    xp: 50,
    duration: '15–30 min',
    tag: 'Observant',
  },
  {
    id: 2,
    icon: Footprints,
    tone: 'orange',
    label: 'MICRO EXPEDITION',
    title: 'Walk one kilometre without your usual route',
    detail: 'Take the next interesting turn. Keep your phone in your pocket.',
    xp: 30,
    duration: '20–40 min',
    tag: 'Wanderer',
  },
  {
    id: 3,
    icon: LocateFixed,
    tone: 'lilac',
    label: 'FRESH EYES',
    title: 'Notice three things you usually walk past',
    detail: 'Look up, down, and behind you. Log the one that surprises you.',
    xp: 40,
    duration: '10–20 min',
    tag: 'Attentive',
  },
]

const seededDiscoveries: Discovery[] = [
  { id: 1, icon: Trees, tone: 'sage', category: 'Plant', name: 'Snake Plant', scientific: 'Dracaena trifasciata', place: 'Gurugram', date: 'Oct 06, 2026', rarity: 'Common' },
  { id: 2, icon: Bird, tone: 'sky', category: 'Bird', name: 'Rose-ringed Parakeet', scientific: 'Psittacula krameri', place: 'Gurugram', date: 'Oct 06, 2026', rarity: 'Uncommon' },
  { id: 3, icon: Flower2, tone: 'pink', category: 'Flower', name: 'Bougainvillea', scientific: 'Bougainvillea glabra', place: 'Gurugram', date: 'Oct 05, 2026', rarity: 'Common' },
  { id: 4, icon: Mountain, tone: 'stone', category: 'Other', name: 'Quartz pebble', scientific: 'Silicon dioxide', place: 'Aravalli trail', date: 'Oct 04, 2026', rarity: 'Found' },
  { id: 5, icon: Leaf, tone: 'mint', category: 'Plant', name: 'Neem', scientific: 'Azadirachta indica', place: 'Gurugram', date: 'Oct 03, 2026', rarity: 'Common' },
]

const categoryCounts = [
  { icon: Trees, label: 'Plants', value: 8, tone: 'sage' },
  { icon: Bird, label: 'Birds', value: 6, tone: 'sky' },
  { icon: Zap, label: 'Insects', value: 4, tone: 'orange' },
  { icon: Flower2, label: 'Flowers', value: 3, tone: 'pink' },
  { icon: Mountain, label: 'Others', value: 2, tone: 'stone' },
]

const seededOutings: Outing[] = [
  { date: 'October 07', day: 'TODAY', distance: '2.4 km', duration: '38 min', discoveryCount: 4, questCount: 3, tone: 'orange' },
  { date: 'October 06', day: 'YESTERDAY', distance: '1.8 km', duration: '27 min', discoveryCount: 2, questCount: 2, tone: 'sage' },
  { date: 'October 04', day: 'SATURDAY', distance: '3.1 km', duration: '51 min', discoveryCount: 6, questCount: 3, tone: 'lilac' },
]

const banyanDiscovery: Omit<Discovery, 'id'> = {
  icon: Trees,
  tone: 'sage',
  category: 'Plant',
  name: 'Indian Banyan',
  scientific: 'Ficus benghalensis',
  place: 'Gurugram',
  date: 'Oct 07, 2026',
  rarity: 'New find',
}

function iconForCategory(category: string): LucideIcon {
  if (category === 'Bird') return Bird
  if (category === 'Flower') return Flower2
  if (category === 'Other') return Mountain
  if (category === 'Insect') return Zap
  return Trees
}

type PersistedState = {
  xp?: number
  completedQuests?: number[]
  pokedex?: Array<Omit<Discovery, 'icon'>>
  dailyChallengeDone?: boolean
  walkingLogged?: boolean
  outings?: Outing[]
}

function loadSavedState() {
  const fallback = { xp: 620, completedQuests: [] as number[], pokedex: seededDiscoveries, dailyChallengeDone: false, walkingLogged: false, outings: seededOutings }
  try {
    const raw = localStorage.getItem('sidequest-irl-state')
    if (!raw) return fallback
    const saved = JSON.parse(raw) as PersistedState
    const restored = Array.isArray(saved.pokedex) && saved.pokedex.length > 0
      ? saved.pokedex.map((item) => ({ ...item, icon: iconForCategory(item.category) }))
      : seededDiscoveries
    return {
      xp: typeof saved.xp === 'number' ? saved.xp : fallback.xp,
      completedQuests: Array.isArray(saved.completedQuests) ? saved.completedQuests : fallback.completedQuests,
      pokedex: restored,
      dailyChallengeDone: saved.dailyChallengeDone === true,
      walkingLogged: saved.walkingLogged === true,
      outings: Array.isArray(saved.outings) && saved.outings.length > 0 ? saved.outings : seededOutings,
    }
  } catch {
    return fallback
  }
}

function getInitialTab(): Tab {
  const hash = window.location.hash.replace('#', '') as Tab
  const path = window.location.pathname.replace(/^\//, '') as Tab
  if (navItems.some((item) => item.id === hash)) return hash
  if (navItems.some((item) => item.id === path)) return path
  return 'today'
}

function App() {
  const [savedState] = useState(loadSavedState)
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab)
  const [activeQuest, setActiveQuest] = useState<number | null>(null)
  const [completedQuests, setCompletedQuests] = useState<number[]>(savedState.completedQuests)
  const [xp, setXp] = useState(savedState.xp)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [pokedex, setPokedex] = useState<Discovery[]>(savedState.pokedex)
  const [outings, setOutings] = useState<Outing[]>(savedState.outings)
  const [dailyChallengeDone, setDailyChallengeDone] = useState(savedState.dailyChallengeDone)
  const [walkingLogged, setWalkingLogged] = useState(savedState.walkingLogged)
  const [toast, setToast] = useState<string | null>(null)
  const [showInstallHint, setShowInstallHint] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onHashChange = () => setActiveTab(getInitialTab())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${navItems.find((item) => item.id === activeTab)?.label ?? 'Today'} · SideQuest IRL`
  }, [activeTab])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    try {
      localStorage.setItem('sidequest-irl-state', JSON.stringify({
        xp,
        completedQuests,
        pokedex: pokedex.map(({ icon: _icon, ...discovery }) => discovery),
        dailyChallengeDone,
        walkingLogged,
        outings,
      }))
    } catch {
      // The demo remains usable when storage is unavailable.
    }
  }, [completedQuests, dailyChallengeDone, outings, pokedex, walkingLogged, xp])

  const level = xp >= 1000 ? 5 : 4
  const levelProgress = Math.min(100, Math.round((xp / 1000) * 100))
  const totalDiscoveries = 23 + Math.max(0, pokedex.length - seededDiscoveries.length)
  const isBanyanCollected = pokedex.some((item) => item.name === banyanDiscovery.name && item.scientific === banyanDiscovery.scientific)
  const collectionCounts = categoryCounts.map((category) => {
    const baseCount = seededDiscoveries.filter((item) => item.category === category.label.slice(0, -1) || (category.label === 'Others' && item.category === 'Other')).length
    const actualCount = pokedex.filter((item) => item.category === category.label.slice(0, -1) || (category.label === 'Others' && item.category === 'Other')).length
    return { ...category, value: category.value + Math.max(0, actualCount - baseCount) }
  })

  function navigate(tab: Tab) {
    setActiveTab(tab)
    window.location.hash = tab === 'today' ? '' : tab
  }

  function startQuest(quest: Quest) {
    setActiveQuest(quest.id)
    setToast(`Quest started · ${quest.duration} outside`)
  }

  function completeQuest(quest: Quest) {
    if (completedQuests.includes(quest.id)) return
    setCompletedQuests((current) => [...current, quest.id])
    setActiveQuest(null)
    setOutings((current) => current.map((outing, index) => index === 0 ? { ...outing, questCount: outing.questCount + 1 } : outing))
    setXp((current) => current + quest.xp)
    setToast(`Quest complete · +${quest.xp} XP`)
  }

  function completeDailyChallenge() {
    if (dailyChallengeDone) return
    setDailyChallengeDone(true)
    setOutings((current) => current.map((outing, index) => index === 0 ? { ...outing, questCount: outing.questCount + 1 } : outing))
    setXp((current) => current + 50)
    setToast('Daily challenge logged · +50 XP')
  }

  function logWalking() {
    if (walkingLogged) return
    setWalkingLogged(true)
    setOutings((current) => current.map((outing, index) => index === 0 ? { ...outing, distance: '3.4 km', duration: '58 min' } : outing))
    setXp((current) => current + 20)
    setToast('1 km walk logged · +20 XP')
  }

  function triggerScan(nextState: ScanState = 'result') {
    setScanState(nextState)
    setToast(nextState === 'uncertain' ? 'Field Guide found a few possible matches' : 'Field Guide is ready with a confident match')
  }

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) triggerScan('result')
  }

  function addDiscovery(discovery: Omit<Discovery, 'id'>) {
    const alreadyCollected = pokedex.some((item) => item.name === discovery.name && item.scientific === discovery.scientific)
    if (alreadyCollected) {
      setXp((current) => current + 5)
      setToast('Already discovered · +5 XP for going back')
      return
    }
    setPokedex((current) => [{ ...discovery, id: Date.now() }, ...current])
    setOutings((current) => current.map((outing, index) => index === 0 ? { ...outing, discoveryCount: outing.discoveryCount + 1 } : outing))
    setXp((current) => current + 50)
    setToast('Added to your Pokédex · +50 XP')
  }

  const page = useMemo(() => {
    switch (activeTab) {
      case 'scan':
        return <ScanPage scanState={scanState} triggerScan={triggerScan} fileInputRef={fileInputRef} onFileSelected={onFileSelected} addDiscovery={() => addDiscovery(banyanDiscovery)} isBanyanCollected={isBanyanCollected} />
      case 'pokedex':
        return <PokedexPage discoveries={pokedex} totalDiscoveries={totalDiscoveries} counts={collectionCounts} />
      case 'adventures':
        return <AdventuresPage outings={outings} />
      case 'profile':
        return <ProfilePage xp={xp} totalDiscoveries={totalDiscoveries} onInstall={() => setShowInstallHint(true)} />
      default:
        return <TodayPage xp={xp} level={level} levelProgress={levelProgress} activeQuest={activeQuest} completedQuests={completedQuests} startQuest={startQuest} completeQuest={completeQuest} onScan={() => navigate('scan')} dailyChallengeDone={dailyChallengeDone} walkingLogged={walkingLogged} completeDailyChallenge={completeDailyChallenge} logWalking={logWalking} />
    }
  }, [activeTab, activeQuest, collectionCounts, completedQuests, dailyChallengeDone, isBanyanCollected, level, levelProgress, outings, pokedex, scanState, totalDiscoveries, walkingLogged, xp])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Compass size={21} strokeWidth={2.2} /><span /></div>
          <div>
            <div className="brand-name">SideQuest <span>IRL</span></div>
            <div className="brand-caption">FIELD GUIDE / 001</div>
          </div>
        </div>
        <div className="rail-rule" />
        <div className="nav-label">EXPLORE</div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-item ${activeTab === item.id ? 'is-active' : ''}`} onClick={() => navigate(item.id)}>
                <Icon size={18} strokeWidth={activeTab === item.id ? 2.2 : 1.8} />
                <span>{item.label}</span>
                <small>{item.key}</small>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-card">
            <div className="streak-top"><span className="pulse-dot" /> <span>FIELD STREAK</span></div>
            <strong>04 <em>days</em></strong>
            <div className="streak-line"><span style={{ width: '64%' }} /></div>
            <p>Two more walks to unlock a new title.</p>
          </div>
          <div className="sidebar-foot"><span>GURUGRAM, IN</span><span>24° CLEAR</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-context"><span className="topbar-kicker">SIDEQUEST IRL</span><span className="slash">/</span><span>{activeTab === 'today' ? 'Your field notes' : navItems.find((item) => item.id === activeTab)?.label}</span></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Current location"><MapPin size={16} /></button>
            <button className="avatar-button" aria-label="Open profile" onClick={() => navigate('profile')}>AK</button>
          </div>
        </header>
        <div className="page-wrap">{page}</div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return <button key={item.id} className={activeTab === item.id ? 'is-active' : ''} onClick={() => navigate(item.id)}><Icon size={19} /><span>{item.label}</span></button>
        })}
      </nav>

      {showInstallHint && <div className="modal-backdrop" onClick={() => setShowInstallHint(false)}><div className="install-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowInstallHint(false)}>×</button><div className="modal-icon"><Compass size={24} /></div><span className="eyebrow">TAKE IT OUTSIDE</span><h3>Install your field guide.</h3><p>Use your browser menu and choose “Add to Home Screen” to keep SideQuest one tap away from your next walk.</p><button className="button button-primary" onClick={() => setShowInstallHint(false)}>Got it <Check size={16} /></button></div></div>}
      {toast && <div className="toast"><CircleCheck size={18} /><span>{toast}</span><button onClick={() => setToast(null)}>×</button></div>}
    </div>
  )
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function TodayPage({ xp, level, levelProgress, activeQuest, completedQuests, startQuest, completeQuest, onScan, dailyChallengeDone, walkingLogged, completeDailyChallenge, logWalking }: { xp: number; level: number; levelProgress: number; activeQuest: number | null; completedQuests: number[]; startQuest: (quest: Quest) => void; completeQuest: (quest: Quest) => void; onScan: () => void; dailyChallengeDone: boolean; walkingLogged: boolean; completeDailyChallenge: () => void; logWalking: () => void }) {
  return <>
    <PageIntro eyebrow="WEDNESDAY · OCT 07, 2026" title={<>Make today<br /><i>noticeable.</i></>} description="Three small reasons to step outside, look closer, and come back with a story." action={<button className="button button-outline" onClick={onScan}><ScanLine size={16} /> Scan a find</button>} />

    <section className="today-overview">
      <div className="level-panel">
        <div className="panel-topline"><span className="eyebrow">CURRENT EXPLORER LEVEL</span><span className="level-number">{String(level).padStart(2, '0')}</span></div>
        <div className="level-copy"><div><strong>Explorer</strong><span>{xp} / 1,000 XP to Level {level + 1}</span></div><Trophy size={27} /></div>
        <div className="progress-track large"><span style={{ width: `${levelProgress}%` }} /></div>
        <div className="level-footer"><span><Zap size={13} /> +{Math.max(0, 1000 - xp)} XP to next level</span><span>QUIETLY CURIOUS</span></div>
      </div>
      <div className="memory-panel">
        <div className="memory-icon"><BrainCircuit size={19} /></div>
        <div><span className="eyebrow">ADVENTURE MEMORY</span><strong>Your kind of detour</strong><p>You keep noticing leafy things and quiet corners. Today’s quests lean that way.</p></div>
        <ArrowUpRight size={17} className="memory-arrow" />
      </div>
    </section>

    <section className="section-block quests-section">
      <div className="section-heading"><div><span className="eyebrow">TODAY’S SIDEQUESTS</span><h2>Pick a thread to follow.</h2></div><span className="section-meta"><Sparkles size={14} /> QUEST MASTER / 03 FRESH ROUTES</span></div>
      <div className="quest-list">
        {quests.map((quest, index) => {
          const Icon = quest.icon
          const isComplete = completedQuests.includes(quest.id)
          const isActive = activeQuest === quest.id
          return <article key={quest.id} className={`quest-card ${isActive ? 'is-started' : ''} ${isComplete ? 'is-complete' : ''}`}>
            <div className={`quest-index ${quest.tone}`}>{String(index + 1).padStart(2, '0')}</div>
            <div className={`quest-icon ${quest.tone}`}><Icon size={22} /></div>
            <div className="quest-main"><div className="quest-label-row"><span className="quest-label">{quest.label}</span><span className="quest-tag">{quest.tag}</span></div><h3>{quest.title}</h3><p>{quest.detail}</p><div className="quest-foot"><span><Clock3 size={14} /> {quest.duration}</span><span className="xp-reward"><Zap size={14} /> +{quest.xp} XP</span></div></div>
            <div className="quest-action">{isComplete ? <span className="completed-mark"><Check size={17} /> Done</span> : isActive ? <button className="button button-primary small" onClick={() => completeQuest(quest)}>Mark complete <Check size={15} /></button> : <button className="quest-start" onClick={() => startQuest(quest)} aria-label={`Start ${quest.title}`}>Start <ArrowUpRight size={17} /></button>}</div>
          </article>
        })}
      </div>
      <div className="safety-note"><Info size={15} /><span>All quests are designed for daylight, public spaces, and your own comfort. Skip anything that doesn’t feel safe.</span><ShieldIcon /></div>
      <div className="activity-strip"><div><span className="eyebrow">SMALL WINS</span><strong>Keep the loop moving.</strong><p>Log the real-world actions that happen between quests.</p></div><div className="activity-actions"><button className={`activity-action ${dailyChallengeDone ? 'is-done' : ''}`} onClick={completeDailyChallenge} disabled={dailyChallengeDone}><span><Sparkles size={15} /> Daily challenge</span><strong>{dailyChallengeDone ? 'Logged' : '+50 XP'}</strong></button><button className={`activity-action ${walkingLogged ? 'is-done' : ''}`} onClick={logWalking} disabled={walkingLogged}><span><Footprints size={15} /> Walk 1 km</span><strong>{walkingLogged ? 'Logged' : '+20 XP'}</strong></button></div></div>
    </section>
  </>
}

function ShieldIcon() { return <span className="shield-badge">SAFE BY DESIGN</span> }

function ScanPage({ scanState, triggerScan, fileInputRef, onFileSelected, addDiscovery, isBanyanCollected }: { scanState: ScanState; triggerScan: (state?: ScanState) => void; fileInputRef: RefObject<HTMLInputElement | null>; onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void; addDiscovery: () => void; isBanyanCollected: boolean }) {
  return <>
    <PageIntro eyebrow="FIELD GUIDE / 02" title={<>What did<br /><i>you find?</i></>} description="Point your camera at something that made you pause. The Field Guide will help you put a name to it." action={<span className="demo-chip"><span className="pulse-dot" /> DEMO MODE</span>} />
    <div className="scanner-layout">
      <section className={`scanner-window ${scanState !== 'idle' ? 'has-result' : ''}`}>
        <div className="scanner-toolbar"><span><ScanLine size={15} /> FIELD GUIDE CAMERA</span><span>OUTDOOR / DAYLIGHT</span></div>
        <div className="scan-visual">
          <div className="scan-corner top-left" /><div className="scan-corner top-right" /><div className="scan-corner bottom-left" /><div className="scan-corner bottom-right" />
          {scanState === 'idle' ? <><div className="scan-orbit"><div className="orbit-dot" /><Sparkles size={32} /></div><span className="scan-instruction">Place a find inside the frame</span><span className="scan-subcopy">Plants · birds · flowers · mushrooms · insects · rocks · other</span></> : <><div className="sample-find">🌳</div><div className="recognition-ring"><span>91%</span></div><span className="scan-instruction">Field Guide matched your find</span><span className="scan-subcopy">One possible story, never the only one</span></>}
        </div>
        <div className="scanner-controls">
          <button className="button button-primary scan-button" onClick={() => fileInputRef.current?.click()}><Camera size={18} /> {scanState === 'idle' ? 'Take a photo' : 'Scan another find'}</button>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={onFileSelected} />
          <button className="text-button" onClick={() => triggerScan('uncertain')}><span>Try a low-confidence example</span><ChevronRight size={16} /></button>
        </div>
      </section>
      <section className="scan-result-column">
        {scanState === 'idle' ? <div className="scan-empty-state"><div className="empty-stamp"><BookOpen size={23} /></div><span className="eyebrow">YOUR NEXT DISCOVERY</span><h2>The best finds are the ones you almost walked past.</h2><p>Take a photo to see a confidence-aware result. Add only what feels right to your personal collection.</p><div className="confidence-legend"><span><i className="legend-dot confident" /> Confident match</span><span><i className="legend-dot possible" /> Possible match</span></div></div> : scanState === 'uncertain' ? <UncertainResult onTryAgain={() => triggerScan('idle')} /> : <ConfidentResult addDiscovery={addDiscovery} isBanyanCollected={isBanyanCollected} />}
      </section>
    </div>
  </>
}

function ConfidentResult({ addDiscovery, isBanyanCollected }: { addDiscovery: () => void; isBanyanCollected: boolean }) {
  return <div className="result-card confident-result"><div className="result-top"><span className="result-state"><span className="confidence-dot" /> IDENTIFIED / CONFIDENT</span><span className="result-confidence">91% <small>confidence</small></span></div><div className="result-species"><div className="result-species-icon sage"><Trees size={28} /></div><div><h2>Indian Banyan</h2><p>Ficus benghalensis</p></div></div><div className="result-details"><div><span className="eyebrow">CATEGORY</span><strong>Tree</strong></div><div><span className="eyebrow">NATIVE REGION</span><strong>Indian subcontinent</strong></div><div><span className="eyebrow">FIELD NOTE</span><strong>Often called the “strangler fig”</strong></div></div><div className="result-disclaimer"><Info size={15} /><span>Confidence is a guide, not a guarantee. Confirm what you can in a trusted field guide.</span></div><button className="button button-primary full" onClick={addDiscovery}>{isBanyanCollected ? <><RotateCcw size={16} /> Already discovered · +5 XP</> : <><Plus size={17} /> Add to Pokédex · +50 XP</>}</button></div>
}

function UncertainResult({ onTryAgain }: { onTryAgain: () => void }) {
  return <div className="result-card uncertain-result"><div className="result-top"><span className="result-state possible-state"><span className="confidence-dot" /> POSSIBLE MATCH</span><span className="result-confidence">71% <small>best guess</small></span></div><div className="possible-heading"><div className="result-species-icon lilac"><Sparkles size={26} /></div><div><h2>A few stories fit.</h2><p>The angle or light makes this one worth another look.</p></div></div><div className="match-list"><div className="match-row"><span className="match-rank">01</span><strong>Indian Banyan</strong><span>71%</span><div className="match-bar"><i style={{ width: '71%' }} /></div></div><div className="match-row"><span className="match-rank">02</span><strong>Peepal Tree</strong><span>19%</span><div className="match-bar"><i style={{ width: '19%' }} /></div></div><div className="match-row"><span className="match-rank">03</span><strong>Other broadleaf</strong><span>10%</span><div className="match-bar"><i style={{ width: '10%' }} /></div></div></div><div className="result-disclaimer"><Info size={15} /><span>Possible matches stay possible until you get a clearer view.</span></div><button className="button button-outline full" onClick={onTryAgain}><Camera size={16} /> Try another photo</button></div>
}

function PokedexPage({ discoveries, totalDiscoveries, counts }: { discoveries: Discovery[]; totalDiscoveries: number; counts: typeof categoryCounts }) {
  return <>
    <PageIntro eyebrow="FIELD NOTES / 03" title={<>Your world,<br /><i>collected.</i></>} description="Every entry is something you noticed with your own eyes. One species, one place in your personal field guide." action={<div className="collection-stamp"><span>{totalDiscoveries}</span><small>/ 100</small><label>DISCOVERED</label></div>} />
    <section className="collection-summary"><div className="collection-count"><span className="eyebrow">MY POKÉDEX</span><strong>{totalDiscoveries} <small>discoveries</small></strong><div className="collection-line"><i style={{ width: `${Math.min(100, totalDiscoveries)}%` }} /></div><span className="muted-copy">Your collection is beginning to have a shape.</span></div><div className="category-counts">{counts.map((category) => { const Icon = category.icon; return <div key={category.label} className="category-count"><div className={`mini-icon ${category.tone}`}><Icon size={16} /></div><strong>{category.value}</strong><span>{category.label}</span></div> })}</div></section>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">RECENTLY LOGGED</span><h2>Your finds, in context.</h2></div><button className="text-button"><span>View all entries</span><ChevronRight size={16} /></button></div><div className="discovery-grid">{discoveries.map((discovery) => <DiscoveryCard key={discovery.id} discovery={discovery} />)}<div className="empty-discovery-card"><div className="plus-ring"><Plus size={23} /></div><strong>Something new is waiting.</strong><p>Go outside and look for the detail you usually miss.</p></div></div></section>
  </>
}

function DiscoveryCard({ discovery }: { discovery: Discovery }) {
  const Icon = discovery.icon
  return <article className="discovery-card"><div className={`discovery-art ${discovery.tone}`}><Icon size={45} strokeWidth={1.35} /><span className="discovery-rarity">{discovery.rarity}</span></div><div className="discovery-content"><span className="quest-label">{discovery.category}</span><h3>{discovery.name}</h3><p>{discovery.scientific}</p><div className="discovery-meta"><span><MapPin size={12} /> {discovery.place}</span><span>{discovery.date}</span></div></div></article>
}

function AdventuresPage({ outings }: { outings: Outing[] }) {
  return <>
    <PageIntro eyebrow="TRAIL LOG / 04" title={<>The places<br /><i>between.</i></>} description="A record of the small radius around you — and the moments you chose to look twice." action={<span className="distance-badge"><Footprints size={15} /> 7.3 KM THIS WEEK</span>} />
    <section className="adventure-hero"><div className="trail-visual"><div className="trail-skyline"><span>MY EXPLORATION</span><div className="trail-points"><i className="point one" /><i className="point two" /><i className="point three" /><i className="point four" /><div className="trail-path" /></div><div className="trail-caption"><span><MapPin size={14} /> 7 places noticed</span><span><Clock3 size={14} /> 2h 04m outside</span></div></div><div className="adventure-note"><span className="eyebrow">A NOTE FROM MEMORY</span><h2>You seem to find more when you slow down.</h2><p>Your discovery rate is up <strong>28%</strong> on walks under 3 km.</p></div></div></section>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">RECENT OUTINGS</span><h2>Keep the trail warm.</h2></div><span className="section-meta">OCTOBER / 2026</span></div><div className="outing-list">{outings.map((outing) => <article className="outing-row" key={outing.date}><div className="outing-date"><strong>{outing.date}</strong><span>{outing.day}</span></div><div className={`outing-marker ${outing.tone}`}><Footprints size={19} /></div><div className="outing-stats"><div><span className="eyebrow">DISTANCE</span><strong>{outing.distance}</strong></div><div><span className="eyebrow">TIME OUTSIDE</span><strong>{outing.duration}</strong></div><div><span className="eyebrow">FIELD NOTES</span><strong>{outing.discoveryCount} discoveries</strong></div><div><span className="eyebrow">QUESTS</span><strong>{outing.questCount} quests completed</strong></div></div><ChevronRight size={17} className="row-chevron" /></article>)}</div></section>
  </>
}

function ProfilePage({ xp, totalDiscoveries, onInstall }: { xp: number; totalDiscoveries: number; onInstall: () => void }) {
  return <>
    <PageIntro eyebrow="YOUR FIELD KIT / 05" title={<>Stay curious,<br /><i>on purpose.</i></>} description="Shape the kind of adventures you want the Quest Master to bring you next." action={<button className="button button-outline" onClick={onInstall}><Plus size={16} /> Add to home screen</button>} />
    <div className="profile-grid"><section className="profile-card identity-card"><div className="identity-avatar">AK</div><span className="eyebrow">EXPLORER PROFILE</span><h2>Arjun K.</h2><p>Gurugram, India <span>·</span> Joined Oct 2026</p><div className="identity-rule" /><div className="profile-metrics"><div><strong>{xp}</strong><span>TOTAL XP</span></div><div><strong>{totalDiscoveries}</strong><span>DISCOVERIES</span></div><div><strong>04</strong><span>DAY STREAK</span></div></div></section><section className="profile-card memory-card-large"><div className="profile-card-heading"><div className="memory-icon"><BrainCircuit size={19} /></div><div><span className="eyebrow">ADVENTURE MEMORY</span><h2>What should the Quest Master know?</h2></div></div><p className="memory-intro">These small signals help future quests feel like they were made for your actual day.</p><div className="interest-list"><span>Plants & trees <button>×</button></span><span>Quiet walks <button>×</button></span><span>Birdwatching <button>×</button></span><button className="add-interest"><Plus size={14} /> Add an interest</button></div><div className="memory-footer"><span><Sparkles size={14} /> Memory is private to this device</span><button className="text-button"><span>How it works</span><ChevronRight size={15} /></button></div></section></div>
    <section className="settings-strip"><div><span className="eyebrow">FIELD SETTINGS</span><h2>Keep the experience lightweight.</h2></div><div className="setting-line"><span><span className="setting-dot on" /> Outdoor-only quests</span><button>ON</button></div><div className="setting-line"><span><span className="setting-dot on" /> Confidence notes</span><button>ON</button></div><div className="setting-line"><span><span className="setting-dot" /> Daily reminder</span><button>OFF</button></div></section>
  </>
}

export default App
