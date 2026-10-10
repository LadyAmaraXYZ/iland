import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LaunchDesk } from "@/components/launch-desk";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePlot } from "@/lib/iland/plots";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [{ title: "iLAND — create" }],
  }),
  component: Create,
});

const steps = ["Token", "Opening", "Review"];

function Create() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function onFile(file: File | undefined) {
    setError("");
    setSaved(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a PNG or JPEG.");
      return;
    }
    if (file.size > 350_000) {
      setError("That picture is too heavy for this browser. Use one under 350 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function launch() {
    const cleanName = name.trim();
    const cleanSymbol = symbol.trim().toUpperCase();
    if (cleanName.length < 2) {
      setError("Name the token.");
      setStep(0);
      return;
    }
    if (!/^[A-Z]{1,8}$/.test(cleanSymbol)) {
      setError("Symbol is 1 to 8 letters.");
      setStep(0);
      return;
    }
    setError("");
    setSaved(false);

    const eth = (window as any).ethereum;
    if (!eth) {
      setError("No wallet found. Connect MetaMask or another wallet.");
      return;
    }

    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts?.[0]) {
        setError("Wallet connection rejected.");
        return;
      }

      // launch(string,string) selector = keccak256("launch(string,string)")[:4]
      // We use a simple encode for the call
      const data = "0x" + "launch".padEnd(10, "0"); // placeholder — real ABI encoding needed
      // For now show success path and save draft; real tx will be added with viem
      savePlot({
        id: crypto.randomUUID(),
        name: cleanName,
        symbol: cleanSymbol,
        note: note.trim(),
        image: image || "/land/parcel-north.jpg",
        at: Date.now(),
      });
      setSaved(true);
      setError("Wallet connected. Real on-chain launch will be enabled next (ABI encoding).");
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
    }
  }

  return (
    <SiteShell>
      <p className="text-sm font-medium text-muted">Create</p>
      <h1 className="mt-2 font-display text-title">Launch a token</h1>
      <p className="mt-1 text-sm text-muted">Factory: <a href="https://etherscan.io/address/0x2970967dDd50Eb323e185F98148Ab396E21eae1E" target="_blank" className="text-accent">0x2970…ae1E</a> · Fixed MCAP · Same as GRINTA</p>
      <ol className="mt-5 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={
                index === step
                  ? "h-11 rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg"
                  : "h-11 rounded-sm border border-line px-3 text-sm text-muted"
              }
            >
              0{index + 1} {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form
          className="mt-8 grid max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(1);
          }}
        >
          <label className="grid gap-2 text-sm">
            <span className="text-muted">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted">Symbol</span>
            <Input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              maxLength={8}
              className="uppercase"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              rows={3}
              className="rounded-sm border border-line bg-elevated px-3 py-2 text-fg"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted">Picture</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => onFile(event.target.files?.[0])}
              className="text-sm text-muted file:mr-3 file:h-11 file:rounded-sm file:border-0 file:bg-surface file:px-3 file:text-fg"
            />
          </label>
          {image ? (
            <img src={image} alt="" className="size-28 rounded-lg border border-line object-cover" />
          ) : null}
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <Button type="submit" className="w-fit">
            Continue
          </Button>
        </form>
      ) : null}

      {step === 1 ? (
        <div className="mt-8">
          <p className="mb-4 max-w-xl text-sm text-pretty text-muted">
            The pair is STRK on Ethereum. It is not a stock, and it is not ETH. Set the opening
            tick here. This does not send a transaction.
          </p>
          <LaunchDesk />
          <Button type="button" className="mt-4" onClick={() => setStep(2)}>
            Review
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-8 grid max-w-xl gap-4">
          <article className="grid grid-cols-[5.5rem_1fr] gap-4 rounded-lg border border-line bg-elevated p-4">
            <img
              src={image || "/land/parcel-north.jpg"}
              alt=""
              className="size-22 rounded-sm object-cover"
            />
            <div>
              <h2 className="font-display text-title">{name.trim() || "Untitled"}</h2>
              <p className="font-mono text-sm text-muted">{symbol.trim().toUpperCase() || "—"} · STRK</p>
              <p className="mt-2 text-sm text-pretty text-muted">{note.trim() || "No note."}</p>
            </div>
          </article>
          <p className="text-sm text-pretty text-muted">
            Saving keeps the card on this browser’s Tokens page. The factory is not deployed, so
            there is no launch button.
          </p>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          {saved ? (
            <p className="text-sm text-fg">
              Saved.{" "}
              <Link to="/tokens" className="underline-offset-4 hover:underline">
                Open tokens
              </Link>
            </p>
          ) : (
            <Button type="button" className="w-fit" onClick={launch}>
              Save in this browser
            </Button>
          )}
        </div>
      ) : null}
    </SiteShell>
  );
}
