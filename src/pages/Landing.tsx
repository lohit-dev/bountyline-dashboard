import { loginUrl } from '../lib/api'
import { rememberDestination } from '../lib/session'

const STEPS = [
  ['Fund an issue', 'A maintainer comments /bounty 150 or ticks an amount. The funder pays through PayPal first, so the money is real before anyone starts.'],
  ['Open a pull request', 'A contributor opens a pull request that says Closes #12. The first one claims the bounty.'],
  ['AI review', 'The AI scores the change out of 100 against a public rubric. It only advises. It never pays anyone by itself.'],
  ['Merge, then paid', 'Paid only if the score passes and the pull request is merged, after a review window in which any maintainer can veto.'],
]

export function Landing() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Pay for merged work, with a human in the loop.</h1>
        <p>
          Bountyline turns a GitHub issue into a funded bounty. An AI reviews the pull request, a maintainer keeps the final say, and the contributor is paid
          through PayPal. Vetoed, cancelled and expired bounties are refunded.
        </p>
        <div>
          <a className="btn btn--primary" href={loginUrl} onClick={() => rememberDestination(window.location.hash)}>
            Sign in with GitHub
          </a>
        </div>
      </section>

      <ol className="steps">
        {STEPS.map(([title, text]) => (
          <li key={title} className="card">
            <strong>{title}</strong>
            <span className="muted small">{text}</span>
          </li>
        ))}
      </ol>

      <section className="card">
        <div className="card__body">
          <h2 className="card__title">What stays private</h2>
          <p className="muted">
            PayPal emails and payment ids are never posted on GitHub. Contributors save a payout address here, where it is encrypted. Payouts are final once
            PayPal has been asked to send them, so the review window is the time to veto.
          </p>
        </div>
      </section>
    </main>
  )
}
