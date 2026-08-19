export default function LiveMatchPage({ params }: { params: { matchId: string } }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <h1 className="text-xl font-black text-white">Both formations locked in</h1>
      <p className="text-sm text-gray-400">
        Match <span className="font-mono text-gray-300">{params.matchId}</span> is ready to start. The live
        bidding round loop — footballer pop-ups, blind bids, and slot assignment — is the next piece to build.
      </p>
    </main>
  );
}
