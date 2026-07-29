const teams = [
  { name: "RATS Esports", tag: "RATS", level: "Main roster", number: "01" },
  { name: "RATS Pungh", tag: "PNG", level: "Competitive roster", number: "02" },
  { name: "RATS Iron", tag: "IRON", level: "Competitive roster", number: "03" },
  { name: "RATS MCD", tag: "MCD", level: "Competitive roster", number: "04" },
];

const navItems = [
  { label: "About", href: "#about" },
  { label: "Teams", href: "#teams" },
  { label: "Join", href: "#join" },
  { label: "Contact", href: "#contact" },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="RATS Esports home">
          <span className="brand-mark">R</span>
          <span>RATS <b>ESPORTS</b></span>
        </a>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a className="nav-cta" href="#join">Join the community <span>↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span /> Swedish grassroots esports</p>
          <h1>WE PLAY<br /><em>TOGETHER.</em></h1>
          <p className="hero-copy">
            Competition with purpose. A home for ambitious players, dedicated
            staff, and everyone who believes esports is better as a community.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#teams">Meet the teams <span>↓</span></a>
            <a className="text-link" href="#about">Our story <span>↗</span></a>
          </div>
        </div>
        <div className="hero-badge" aria-hidden="true">
          <span>R</span>
          <small>EST. IN SWEDEN</small>
        </div>
        <div className="scroll-note" aria-hidden="true">SCROLL TO EXPLORE <span /></div>
      </section>

      <section className="section about" id="about">
        <div>
          <p className="section-label">01 — About us</p>
          <h2>MORE THAN<br />A <em>TEAM.</em></h2>
        </div>
        <div className="about-copy">
          <p className="lead">
            RATS Esports is a Swedish grassroots association building a
            structured, welcoming, and competitive home for players who want
            to grow together.
          </p>
          <p>
            We bring teams, coaches, managers, and community members under one
            banner. Through regular practice, shared knowledge, and a long-term
            mindset, we’re creating something that lasts beyond a single season.
          </p>
          <div className="values">
            <div><strong>04</strong><span>Competitive teams</span></div>
            <div><strong>01</strong><span>Shared community</span></div>
            <div><strong>∞</strong><span>Room to grow</span></div>
          </div>
        </div>
      </section>

      <section className="section teams" id="teams">
        <div className="section-heading">
          <div>
            <p className="section-label">02 — Our teams</p>
            <h2>FOUR ROSTERS.<br /><em>ONE BANNER.</em></h2>
          </div>
          <p>Different journeys. The same standards, support, and ambition.</p>
        </div>
        <div className="team-grid">
          {teams.map((team) => (
            <article className="team-card" key={team.name}>
              <span className="card-number">{team.number}</span>
              <div className="team-monogram" aria-hidden="true">{team.tag[0]}</div>
              <div>
                <p>{team.level}</p>
                <h3>{team.name}</h3>
              </div>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="join" id="join">
        <div className="join-pattern" aria-hidden="true">RATS</div>
        <p className="section-label">03 — Join the community</p>
        <h2>FIND YOUR PLACE<br />IN <em>RATS.</em></h2>
        <p>
          Player, coach, manager, creator, or supporter—if you want to help
          build Swedish grassroots esports, we want to hear from you.
        </p>
        <a className="button button-dark" href="#contact">Start a conversation <span>↗</span></a>
      </section>

      <section className="section contact" id="contact">
        <div>
          <p className="section-label">04 — Contact</p>
          <h2>LET&apos;S BUILD<br /><em>SOMETHING.</em></h2>
        </div>
        <div className="contact-links">
          <a href="#" aria-label="Discord link placeholder">
            <span><small>Community</small>Discord</span><b>↗</b>
          </a>
          <a href="mailto:hello@ratsesports.se">
            <span><small>Email</small>hello@ratsesports.se</span><b>↗</b>
          </a>
          <a href="#" aria-label="Social media link placeholder">
            <span><small>Follow us</small>Social media</span><b>↗</b>
          </a>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">R</span><span>RATS <b>ESPORTS</b></span></a>
        <p>Swedish grassroots esports.<br />Built together.</p>
        <p className="copyright">© {new Date().getFullYear()} RATS Esports</p>
      </footer>
    </main>
  );
}
