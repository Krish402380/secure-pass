// src/App.jsx
import React from "react";
import { ShieldCheck, RefreshCcw, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

import "./App.css";

function PasswordStrengthBar({ strength }) {
  const width = `${Math.min(strength, 100)}%`;
  const bg = strength >= 80 ? "bg-green-500" : strength >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div className={`h-full transition-all duration-300 ease-in-out ${bg}`} style={{ width }}></div>
    </div>
  );
}

function App() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:',.<>/?";

    if (!charset) return;

    let pwd = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      pwd += charset[randomIndex];
    }
    setPassword(pwd);
    const bits = Math.round(length * Math.log2(charset.length));
    setStrength(bits > 128 ? 100 : Math.round((bits / 128) * 100));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold font-headline text-foreground">PassForge</h1>
              <p className="text-muted-foreground">Your secure password workspace.</p>
            </div>
          </div>

          <div className="relative">
            <input
              readOnly
              className="w-full p-3 pr-10 text-lg font-mono border rounded-lg bg-muted/20 text-foreground"
              value={password}
              placeholder="Your secure password"
            />
            <button onClick={copyToClipboard} className="absolute right-3 top-1/2 -translate-y-1/2">
              <ClipboardCopy className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-1">
            <PasswordStrengthBar strength={strength} />
            <div className="text-right text-sm text-muted-foreground">
              {strength > 80 ? "Very Strong" : strength > 50 ? "Strong" : strength > 30 ? "Weak" : "Very Weak"}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Password Length</label>
            <div className="flex items-center justify-between">
              <Slider value={[length]} onValueChange={([val]) => setLength(val)} min={4} max={64} className="w-full" />
              <span className="ml-3 text-sm text-primary font-bold w-6 text-right">{length}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Uppercase (A–Z)</span>
              <Switch checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
            </div>
            <div className="flex items-center justify-between">
              <span>Lowercase (a–z)</span>
              <Switch checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
            </div>
            <div className="flex items-center justify-between">
              <span>Numbers (0–9)</span>
              <Switch checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
            </div>
            <div className="flex items-center justify-between">
              <span>Symbols (!@#...)</span>
              <Switch checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
            </div>
          </div>

          <Button onClick={generatePassword} className="w-full text-base font-semibold">
            <RefreshCcw className="w-4 h-4 mr-2" /> Generate New
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
