import React, { useState, useMemo } from 'react';
import { Calculator, Home, TrendingUp, AlertTriangle, CheckCircle, XCircle, Euro, Percent, Calendar, ArrowRight, RefreshCw } from 'lucide-react';

export default function SimulateurCIOP() {
  // État des inputs
  const [inputs, setInputs] = useState({
    prixAchat: 190000,
    surface: 50,
    varangue: 14,
    loyerMensuel: 750,
    chargesAnnuelles: 1800,
    plusValuePrevue: 5,
    dureeLocation: 5,
    tauxEmprunt: 4,
    partNicolas: 65,
    ccSarl: 50000
  });

  // Constantes CIOP 2026
  const PLAFOND_CIOP_M2 = 3575;
  const TAUX_CIOP = 0.35;
  const TAUX_CC = 0.01;
  const TAUX_IS = 0.25;
  const TAUX_FLAT_TAX = 0.30;

  // Calculs
  const calculs = useMemo(() => {
    const surfaceEligible = Math.min(inputs.surface + inputs.varangue, inputs.surface + 14);
    const baseCIOP = Math.min(inputs.prixAchat, surfaceEligible * PLAFOND_CIOP_M2);
    const ciop = Math.round(baseCIOP * TAUX_CIOP);
    
    const besoinFinancement = inputs.prixAchat - ciop;
    const empruntBancaire = Math.max(0, besoinFinancement - inputs.ccSarl);
    
    const loyerAnnuel = inputs.loyerMensuel * 12;
    const loyerNet = loyerAnnuel - inputs.chargesAnnuelles;
    const loyersTotal = loyerNet * inputs.dureeLocation;
    
    const prixRevente = Math.round(inputs.prixAchat * (1 + inputs.plusValuePrevue / 100));
    const plusValue = prixRevente - inputs.prixAchat;
    
    // Intérêts sur la durée
    const interetsCC = Math.round(inputs.ccSarl * TAUX_CC * inputs.dureeLocation);
    const interetsBanque = Math.round(empruntBancaire * (inputs.tauxEmprunt / 100) * inputs.dureeLocation * 0.6); // Approximation
    const totalInterets = interetsCC + interetsBanque;
    
    // Résultat brut
    const gainBrut = ciop + loyersTotal + plusValue - totalInterets;
    
    // Après IS (sur plus-value et bénéfices)
    const beneficeImposable = loyersTotal + plusValue - totalInterets;
    const is = Math.round(Math.max(0, beneficeImposable) * TAUX_IS);
    const gainApresIS = gainBrut - is;
    
    // Flat tax si distribution
    const flatTax = Math.round(Math.max(0, gainApresIS) * TAUX_FLAT_TAX);
    const gainNet = gainApresIS - flatTax;
    
    // Part Nicolas
    const gainNicolas = Math.round(gainNet * (inputs.partNicolas / 100));
    
    // ROI
    const apportNicolas = 10000 * (inputs.partNicolas / 100);
    const roi = apportNicolas > 0 ? Math.round((gainNicolas / apportNicolas) * 100) : 0;
    
    // Score d'investissement (sur 100)
    let score = 50;
    
    // Bonus/Malus CIOP
    const ratioCIOP = ciop / inputs.prixAchat;
    if (ratioCIOP >= 0.35) score += 15;
    else if (ratioCIOP >= 0.30) score += 10;
    else if (ratioCIOP >= 0.25) score += 5;
    else score -= 10;
    
    // Bonus/Malus rendement locatif
    const rendementLocatif = (loyerNet / inputs.prixAchat) * 100;
    if (rendementLocatif >= 5) score += 15;
    else if (rendementLocatif >= 4) score += 10;
    else if (rendementLocatif >= 3) score += 5;
    else score -= 10;
    
    // Bonus/Malus prix au m²
    const prixM2 = inputs.prixAchat / inputs.surface;
    if (prixM2 <= 3000) score += 10;
    else if (prixM2 <= 3500) score += 5;
    else if (prixM2 > 4000) score -= 10;
    
    // Bonus/Malus gain Nicolas
    if (gainNicolas >= 50000) score += 10;
    else if (gainNicolas >= 30000) score += 5;
    else if (gainNicolas < 10000) score -= 15;
    
    score = Math.max(0, Math.min(100, score));
    
    let verdict, verdictColor, verdictIcon;
    if (score >= 75) {
      verdict = "EXCELLENT";
      verdictColor = "text-green-600 bg-green-100";
      verdictIcon = "🚀";
    } else if (score >= 60) {
      verdict = "BON";
      verdictColor = "text-emerald-600 bg-emerald-100";
      verdictIcon = "✅";
    } else if (score >= 45) {
      verdict = "MOYEN";
      verdictColor = "text-yellow-600 bg-yellow-100";
      verdictIcon = "⚠️";
    } else if (score >= 30) {
      verdict = "RISQUÉ";
      verdictColor = "text-orange-600 bg-orange-100";
      verdictIcon = "⚡";
    } else {
      verdict = "À ÉVITER";
      verdictColor = "text-red-600 bg-red-100";
      verdictIcon = "❌";
    }
    
    return {
      surfaceEligible,
      baseCIOP,
      ciop,
      besoinFinancement,
      empruntBancaire,
      loyerAnnuel,
      loyerNet,
      loyersTotal,
      prixRevente,
      plusValue,
      interetsCC,
      interetsBanque,
      totalInterets,
      gainBrut,
      is,
      gainApresIS,
      flatTax,
      gainNet,
      gainNicolas,
      apportNicolas,
      roi,
      rendementLocatif,
      prixM2: inputs.prixAchat / inputs.surface,
      score,
      verdict,
      verdictColor,
      verdictIcon
    };
  }, [inputs]);

  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const resetDefaults = () => {
    setInputs({
      prixAchat: 190000,
      surface: 50,
      varangue: 14,
      loyerMensuel: 750,
      chargesAnnuelles: 1800,
      plusValuePrevue: 5,
      dureeLocation: 5,
      tauxEmprunt: 4,
      partNicolas: 65,
      ccSarl: 50000
    });
  };

  const InputField = ({ label, field, value, suffix, min, max, step = 1 }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, subValue, color = "green" }) => (
    <div className={`bg-${color}-50 rounded-lg p-3 border border-${color}-200`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className={`text-lg font-bold text-${color}-700`}>{value}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-xl">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Simulateur CIOP</h1>
                <p className="text-xs text-gray-500">Évalue tes investissements immobiliers</p>
              </div>
            </div>
            <button 
              onClick={resetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Score principal */}
        <div className={`rounded-2xl shadow-lg p-6 mb-4 ${calculs.verdictColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl mb-1">{calculs.verdictIcon}</div>
              <div className="text-3xl font-black">{calculs.verdict}</div>
              <div className="text-sm opacity-75">Score: {calculs.score}/100</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">Tu gagnes</div>
              <div className="text-3xl font-black">{calculs.gainNicolas.toLocaleString()} €</div>
              <div className="text-sm opacity-75">ROI: {calculs.roi}%</div>
            </div>
          </div>
          
          {/* Barre de score */}
          <div className="mt-4 bg-white/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-current rounded-full transition-all duration-500"
              style={{ width: `${calculs.score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              Caractéristiques du bien
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                label="Prix d'achat" 
                field="prixAchat" 
                value={inputs.prixAchat} 
                suffix="€"
                min={50000}
                max={500000}
                step={5000}
              />
              <InputField 
                label="Surface habitable" 
                field="surface" 
                value={inputs.surface} 
                suffix="m²"
                min={20}
                max={150}
              />
              <InputField 
                label="Varangue" 
                field="varangue" 
                value={inputs.varangue} 
                suffix="m²"
                min={0}
                max={20}
              />
              <InputField 
                label="Loyer mensuel" 
                field="loyerMensuel" 
                value={inputs.loyerMensuel} 
                suffix="€"
                min={300}
                max={2000}
                step={50}
              />
              <InputField 
                label="Charges annuelles" 
                field="chargesAnnuelles" 
                value={inputs.chargesAnnuelles} 
                suffix="€"
                min={500}
                max={5000}
                step={100}
              />
              <InputField 
                label="Plus-value prévue" 
                field="plusValuePrevue" 
                value={inputs.plusValuePrevue} 
                suffix="%"
                min={-10}
                max={30}
              />
            </div>

            <h3 className="font-bold text-gray-800 mt-4 mb-3 flex items-center gap-2">
              <Euro className="w-5 h-5 text-green-600" />
              Financement
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                label="Compte courant SARL" 
                field="ccSarl" 
                value={inputs.ccSarl} 
                suffix="€"
                min={0}
                max={150000}
                step={10000}
              />
              <InputField 
                label="Taux emprunt banque" 
                field="tauxEmprunt" 
                value={inputs.tauxEmprunt} 
                suffix="%"
                min={1}
                max={8}
                step={0.1}
              />
              <InputField 
                label="Durée location" 
                field="dureeLocation" 
                value={inputs.dureeLocation} 
                suffix="ans"
                min={5}
                max={15}
              />
              <InputField 
                label="Ta part (Nicolas)" 
                field="partNicolas" 
                value={inputs.partNicolas} 
                suffix="%"
                min={50}
                max={80}
              />
            </div>
          </div>

          {/* Résultats */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Analyse financière
            </h2>

            {/* CIOP */}
            <div className="bg-green-600 text-white rounded-xl p-3 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs opacity-75">CIOP récupéré (35%)</div>
                  <div className="text-2xl font-bold">{calculs.ciop.toLocaleString()} €</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-75">Base éligible</div>
                  <div className="text-sm">{calculs.baseCIOP.toLocaleString()} €</div>
                </div>
              </div>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">Prix/m²</div>
                <div className="font-bold text-gray-800">{Math.round(calculs.prixM2).toLocaleString()} €</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500">Rendement locatif</div>
                <div className="font-bold text-gray-800">{calculs.rendementLocatif.toFixed(1)}%</div>
              </div>
            </div>

            {/* Détail financement */}
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Financement</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Besoin après CIOP</span>
                  <span className="font-medium">{calculs.besoinFinancement.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">→ Compte courant SARL</span>
                  <span className="text-green-600">{inputs.ccSarl.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">→ Emprunt bancaire</span>
                  <span className="text-orange-600">{calculs.empruntBancaire.toLocaleString()} €</span>
                </div>
              </div>
            </div>

            {/* Revenus */}
            <div className="bg-blue-50 rounded-xl p-3 mb-3">
              <div className="text-xs font-medium text-blue-600 mb-2">Revenus sur {inputs.dureeLocation} ans</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loyers nets</span>
                  <span className="font-medium text-blue-700">+{calculs.loyersTotal.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plus-value revente</span>
                  <span className="font-medium text-blue-700">+{calculs.plusValue.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Intérêts payés</span>
                  <span className="font-medium text-red-600">-{calculs.totalInterets.toLocaleString()} €</span>
                </div>
              </div>
            </div>

            {/* Résultat final */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-75">Gain brut</span>
                <span className="font-bold">{calculs.gainBrut.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm opacity-75">
                <span>IS (25%) + Flat tax (30%)</span>
                <span>-{(calculs.is + calculs.flatTax).toLocaleString()} €</span>
              </div>
              <hr className="border-white/30 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-medium">🎯 Ta part ({inputs.partNicolas}%)</span>
                <span className="text-2xl font-black">{calculs.gainNicolas.toLocaleString()} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conseils */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mt-4">
          <h2 className="font-bold text-gray-800 mb-3">💡 Conseils pour ce bien</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {calculs.prixM2 > 3575 && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-700">Prix/m² ({Math.round(calculs.prixM2)}€) dépasse le plafond CIOP (3575€)</span>
              </div>
            )}
            {calculs.prixM2 <= 3575 && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-green-700">Prix/m² ({Math.round(calculs.prixM2)}€) dans le plafond CIOP ✓</span>
              </div>
            )}
            {calculs.rendementLocatif >= 4 ? (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-green-700">Bon rendement locatif ({calculs.rendementLocatif.toFixed(1)}%) ✓</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-yellow-700">Rendement locatif faible ({calculs.rendementLocatif.toFixed(1)}%)</span>
              </div>
            )}
            {inputs.varangue < 14 && (
              <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-yellow-700">Varangue {inputs.varangue}m² - tu peux aller jusqu'à 14m² éligibles</span>
              </div>
            )}
            {calculs.ciop >= inputs.prixAchat * 0.33 && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-green-700">CIOP optimal ({Math.round(calculs.ciop / inputs.prixAchat * 100)}% du prix) ✓</span>
              </div>
            )}
            {calculs.gainNicolas >= 30000 && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-green-700">Gain intéressant pour toi ({calculs.gainNicolas.toLocaleString()}€) ✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-4 pb-4">
          Simulateur CIOP • Nicolas INCANA • Répartition {inputs.partNicolas}% / {100 - inputs.partNicolas}%
        </div>
      </div>
    </div>
  );
}
