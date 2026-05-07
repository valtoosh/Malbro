// apps/frontend/app/manifesto/page.tsx
import { PageShell, Footnote, FootnoteList, ChevronDivider } from '@marlbro/ui';

export const metadata = { title: 'Manifesto' };

export default function ManifestoPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §14">
      <article className="max-w-[760px] mx-auto">
        <p className="font-mono text-eyebrow uppercase mb-4">§05 — MANIFESTO</p>
        <h1 className="font-display font-black text-h1 lg:text-d1 leading-[0.9] tracking-[-0.04em]">
          ON THE MATTER OF GLORY.
        </h1>

        <p className="font-mono text-caption uppercase tracking-[0.12em] mt-6">
          A POSITION PAPER OF THE MARLBRO FOUNDATION
        </p>

        <ChevronDivider className="mt-8 mb-12 h-[16px]" />

        <div className="space-y-6 text-bodyL leading-relaxed text-ink-2">
          <p>
            The Foundation observes a generational decline in masculine carriage, attributable in
            part to the substitution of the cigarette by the rechargeable nicotine vaporizer
            <Footnote n={1} /> — an article of demonstrably non-Marlbro-compatible aesthetic and
            of questionable structural integrity. This document articulates the corrective
            program by which the Foundation intends to address the matter.
          </p>

          <p>
            The Marlbro Foundation does not regard itself as nostalgic. The Foundation is, in the
            strictest sense, restorative. The cigarette — and specifically the Marlboro Red, hereby
            tributed in this Foundation&apos;s nominal misspelling
            <Footnote n={2} /> — is held to constitute the symbolic apparatus of a particular
            register of bearing, comportment, and grit which the Foundation finds the present
            generation insufficiently equipped to perform.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            I. ON THE VAPE.
          </h2>

          <p>
            The vape is not a cigarette. The vape does not produce ash. The vape does not
            require a match, a windbreak, a hand to cup the flame. The vape does not communicate
            anything about its operator beyond the operator&apos;s fluorescent dependence. The vape,
            in its essential nature, is a USB-rechargeable plastic dummy
            <Footnote n={3} />.
          </p>

          <p>
            The Foundation does not legislate against the vape. The Foundation does not seize
            vapes from the citizenry, although the Foundation observes that the citizenry has, in
            many cases, surrendered them voluntarily upon contemplation of the alternative. The
            Foundation merely observes that the substitution is incomplete, and that the
            substitution&apos;s continued prevalence has wrought a measurable decline in the carriage
            of the modern American (and, increasingly, global) male.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            II. ON THE MARLBRO RED.
          </h2>

          <p>
            The Foundation prefers the Marlboro Red. The Foundation does not endorse any tobacco
            product
            <Footnote n={4} />. The Foundation cites the Marlboro Red as the canonical referent
            because of its historical association with a particular archetype — the man at
            distance, in weather, in possession of his own time — which the Foundation regards as
            instructive.
          </p>

          <p>
            The Foundation&apos;s namesake (Marlbro) is rendered with one fewer &lsquo;o&rsquo; than the
            tobacco product (Marlboro). This is intentional. The Foundation is not the Marlboro
            Company. The Foundation has no commercial relationship with Altria, Philip Morris
            International, or any tobacco enterprise. The Foundation operates exclusively as a
            grant-issuing instrument denominated in $MARLBRO and SOL.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            III. ON THE GRANT PROGRAM.
          </h2>

          <p>
            The Foundation issues two classes of grant. The first, the Bounty Board, comprises
            curated discretionary subsidies attached to specified acts of carriage. The second,
            the Open Grant, is an instrument by which any qualifying applicant may seek a
            standardized disbursement upon furnishing documentation of an authentic transaction.
            All grants are subject to manual review pursuant to Schedule R-7 §11
            <Footnote n={5} />.
          </p>

          <p>
            The Foundation does not regard its program as transactional. The Foundation does not
            regard itself as a vendor. The Foundation regards each disbursement as a small
            inscription on the public ledger
            <Footnote n={6} /> — a record, in perpetuity, that one (1) man, on one (1) day, lit
            one (1) Marlbro Red and made the small private gesture by which the entire prior
            century carried itself.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            IV. ON GLORY.
          </h2>

          <p>
            Glory, as the Foundation uses the term, refers to the unrecorded majority of small
            instances in which the prior generations of men comported themselves with dignity in
            unsupervised conditions. Glory is the unrecognized photograph. Glory is the smoke
            curling out the truck window at the rest stop on a Wednesday in 1983. Glory is the
            specific cadence by which a man, having just buried his father, lights one against
            the wind without commentary.
          </p>

          <p>
            The Foundation cannot manufacture glory. The Foundation can, however, fund its
            documentation. This is the program.
          </p>

          <p className="font-mono text-caption uppercase tracking-[0.12em] pt-12 text-ink">
            — THE BOARD OF DIRECTORS, THE MARLBRO FOUNDATION
          </p>
          <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2">
            FILED THIS 6TH DAY OF MAY, 2026
          </p>
        </div>

        <FootnoteList
          items={[
            { n: 1, text: 'The rechargeable nicotine vaporizer (colloquially "vape") is a battery-operated handheld device which aerosolizes a flavored nicotine solution for inhalation. The Foundation expresses no view on its medical implications, only on its aesthetic.' },
            { n: 2, text: 'The Marlbro Foundation is not affiliated with the Marlboro brand, Altria Group Inc., or Philip Morris International. The misspelling is intentional and constitutes the Foundation\'s sole legal distinction.' },
            { n: 3, text: 'Plastic; sometimes metal-cased. The Foundation does not regard the casing material as exculpatory.' },
            { n: 4, text: 'Schedule R-7 §3(a): "The Foundation explicitly disclaims endorsement of any tobacco or nicotine product. Reference to the Marlboro Red is referential, not promotional. The Foundation does not, will not, and cannot encourage tobacco consumption."' },
            { n: 5, text: 'Schedule R-7 §11(a)–(g): the manual review procedure. Submissions are reviewed by Foundation officers; approval triggers an irrevocable on-chain disbursement.' },
            { n: 6, text: 'The Solana ledger. Disbursements are public, transparent, and immutable, in keeping with the Foundation\'s commitment to perpetual record-keeping.' },
          ]}
        />
      </article>
    </PageShell>
  );
}
