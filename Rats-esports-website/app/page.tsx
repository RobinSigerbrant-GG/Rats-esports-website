const teams = [
  {
    name: "RATS ESPORTS",
    tag: "RATS",
    level: "Huvudlag",
    number: "01",
    logo: "/rats-logo-transparent-v2.png",
    accent: "yellow",
    roster: null,
  },
  {
    name: "RATS PUNGH",
    tag: "PNG",
    level: "Tävlingslag",
    number: "02",
    logo: "/team-pungh.png",
    accent: "pink",
    roster: [
      ["Top", "RAT Swedishking#RATS"],
      ["Jungle", "RAT Vmuuz#nr1"],
      ["Mid", "Mufasa#Yeah"],
      ["Bot", "DBR Derph#DBR"],
      ["Support", "TRYOUTS"],
    ],
  },
  {
    name: "RATS IRON",
    tag: "IRON",
    level: "Tävlingslag",
    number: "03",
    logo: "/team-iron.png",
    accent: "bronze",
    roster: [
      ["Top", "Rat gryb#1337"],
      ["Jungle", "RAT Krankee#1337"],
      ["Mid", "RAT Teammate#2626"],
      ["Bot", "RAT Snuskmackan#IRON"],
      ["Support", "RAT WeeYeah#IRON"],
    ],
  },
  {
    name: "RATS MCD",
    tag: "MCD",
    level: "Tävlingslag",
    number: "04",
    logo: "/team-mcd.png",
    accent: "green",
    roster: [
      ["Top", "RAT Veino#RATS"],
      ["Jungle", "Nikita Rósa#Upir"],
      ["Mid", "Blex#haha"],
      ["Bot", "Yuzu#Junos"],
      ["Support", "RAT M34N#RATS"],
    ],
  },
];

const navItems = [
  { label: "Om oss", href: "#about" },
  { label: "Lagen", href: "#teams" },
  { label: "Gå med", href: "#join" },
  { label: "Kontakt", href: "#contact" },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="RATS Esports startsida">
          <span className="brand-logo" aria-hidden="true" />
          <span>RATS <b>ESPORTS</b></span>
        </a>
        <nav aria-label="Huvudnavigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a className="nav-cta" href="https://discord.gg/pWmNDCJgj7" target="_blank" rel="noreferrer">
          Gå med i gemenskapen <span>↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span /> SVENSK ESPORTFÖRENING INOM LEAGUE OF LEGENDS</p>
          <h1>RATS<br /><em>ON TOP.</em></h1>
          <p className="hero-copy">
            Vi spelar för att ha kul. Tränar för att utvecklas. Tävlar för att vinna.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#teams">Möt lagen <span>↓</span></a>
            <a className="text-link" href="#about">Vår historia <span>↗</span></a>
          </div>
        </div>
        <div className="hero-badge">
          <img src="/rats-logo-transparent-v2.png" alt="RATS Esports logotyp med råtta och kockmössa" />
        </div>
        <div className="scroll-note" aria-hidden="true">UTFORSKA MER <span /></div>
      </section>

      <section className="intro-statement" aria-label="Vår gemenskap">
        <p className="section-label">DET HÄR ÄR RATS</p>
        <p>
          RATS samlar ambitiösa spelare och engagerade människor med en gemensam
          kärlek till League of Legends. Här får viljan att bli bättre gå hand i
          hand med glädjen i att spela tillsammans. Vi bygger en miljö där vi
          utmanar varandra, firar framstegen och alltid strävar efter nästa nivå
          som spelare, lag och förening.
        </p>
      </section>

      <section className="section about" id="about">
        <div>
          <p className="section-label">01 — OM OSS</p>
          <h2>ETT ANDRA HEM<br />FÖR <em>AMBITIÖSA.</em></h2>
        </div>
        <div className="about-copy">
          <p className="lead">Ett andra hem för spelare med ambitioner.</p>
          <p>
            RATS är en esportförening med rötterna i det svenska föreningslivet.
            Vi drivs av människor som lägger ner lite mer tid än de egentligen
            har på League of Legends, helt enkelt för att vi älskar spelet och
            tror på det vi bygger tillsammans.
          </p>
          <p>
            Hos oss ska det finnas utrymme att satsa. Att träna målmedvetet,
            tävla på riktigt och se hur långt man kan nå. Men RATS handlar om mer
            än resultat. Vi vill vara platsen där du känner dina lagkamrater, där
            feedback hjälper dig framåt och där både vinster och motgångar blir
            en del av utvecklingen.
          </p>
          <p>
            Vår ambition är tydlig: att hela tiden bli bättre utan att tappa det
            som gör resan värd att göra. Därför bygger vi en positiv, konstruktiv
            och levande gemenskap där våra medlemmar kan utvecklas, prestera och
            framför allt trivas.
          </p>
          <div className="values">
            <div><strong>04</strong><span>Tävlingslag</span></div>
            <div><strong>01</strong><span>Gemensam förening</span></div>
            <div><strong>∞</strong><span>Utrymme att växa</span></div>
          </div>
        </div>
      </section>

      <section className="section teams" id="teams">
        <div className="section-heading">
          <div>
            <p className="section-label">02 — VÅRA LAG</p>
            <h2>FYRA LAG.<br /><em>EN FÖRENING.</em></h2>
          </div>
          <p>Olika resor. Samma gemenskap, struktur och ambition.</p>
        </div>
        <div className="team-grid">
          {teams.map((team) => (
            <article
              className={`team-card team-card-${team.accent}`}
              key={team.name}
              tabIndex={0}
              aria-label={`${team.name}. Fokusera eller håll muspekaren över kortet för att visa laguppställningen.`}
            >
              <span className="card-number">{team.number}</span>
              <span className="card-hint">Visa laguppställning <b>↗</b></span>
              <img className="team-logo" src={team.logo} alt={`${team.name} logotyp`} />
              <div className="team-summary">
                <p>{team.level}</p>
                <h3>{team.name}</h3>
              </div>
              <div className="roster-panel">
                <div className="roster-heading">
                  <span>{team.tag}</span>
                  <strong>Aktuell laguppställning</strong>
                </div>
                {team.roster ? (
                  <ul className="roster-list" aria-label={`${team.name} laguppställning`}>
                    {team.roster.map(([role, player]) => (
                      <li key={role}>
                        <span>{role}</span>
                        <strong>{player}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="roster-tba">Laguppställning meddelas snart</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="join" id="join">
        <div className="join-pattern" aria-hidden="true">RATS</div>
        <p className="section-label">03 — BLI EN DEL AV GEMENSKAPEN</p>
        <h2>HITTA DIN PLATS<br />I <em>RATS.</em></h2>
        <p>
          Spelare, coach, manager, kreatör eller supporter — vill du vara med och
          bygga svensk League of Legends-esport vill vi gärna höra från dig.
        </p>
        <a className="button button-dark" href="https://discord.gg/pWmNDCJgj7" target="_blank" rel="noreferrer">
          Gå med i vår Discord <span>↗</span>
        </a>
      </section>

      <section className="section contact" id="contact">
        <div>
          <p className="section-label">04 — KONTAKT</p>
          <h2>LÅT OSS BYGGA<br /><em>NÅGOT TILLSAMMANS.</em></h2>
        </div>
        <div className="contact-links">
          <a href="https://discord.gg/pWmNDCJgj7" target="_blank" rel="noreferrer">
            <span><small>Gemenskap</small>Discord</span><b>↗</b>
          </a>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top">
          <span className="brand-logo" aria-hidden="true" />
          <span>RATS <b>ESPORTS</b></span>
        </a>
        <p>Svensk esportförening inom League of Legends.<br />Byggd tillsammans.</p>
        <p className="copyright">© {new Date().getFullYear()} RATS Esports</p>
      </footer>
    </main>
  );
}
