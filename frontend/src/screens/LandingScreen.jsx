export default function LandingScreen({ onOpenStudio }) {
  return (
    <main className="shell shell-centered">
      <section className="hero hero-home">
        <div className="hero-copy">
          <div className="eyebrow">Welcome</div>
          <h1>Run your Tambola night like a proper game studio.</h1>
          <p>
            Create a game, track prize winners, manage family groups, and generate the final settlement
            without doing manual math at the end of the night.
          </p>
        </div>

        <div className="landing-actions">
          <button className="button-primary button-large" type="button" onClick={onOpenStudio}>
            Game Studio
          </button>
        </div>
      </section>
    </main>
  );
}
