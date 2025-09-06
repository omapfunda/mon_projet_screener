// frontend/components/ScreenerControls.js
"use client";

export default function ScreenerControls({ 
  indices, 
  criteria, 
  onCriteriaChange, // Fonction reçue du parent pour mettre à jour l'état
  onRunAnalysis, 
  isLoading 
}) {

  // Ce gestionnaire générique informe le parent de tout changement
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'range' ? parseFloat(value) : value;
    onCriteriaChange(name, finalValue); // Appel de la fonction du parent
  };

  return (
    <aside className="sidebar">
      <h2>Paramètres de Screening</h2>
      
      <div className="control-group">
        <label htmlFor="index_name">Indice Boursier</label>
        {/* L'élément <select> est maintenant correctement "contrôlé" par l'état du parent */}
        <select 
          id="index_name" 
          name="index_name" 
          value={criteria.index_name} // Affiche la valeur actuelle de l'état
          onChange={handleChange}     // Appelle la fonction de mise à jour au changement
        >
          {indices.map(idx => <option key={idx} value={idx}>{idx}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="pe_max">Ratio P/E maximum ({criteria.pe_max})</label>
        <input type="range" id="pe_max" name="pe_max" min="5" max="50" value={criteria.pe_max} onChange={handleChange} />
      </div>
      
      <div className="control-group">
        <label htmlFor="pb_max">Ratio P/B maximum ({criteria.pb_max.toFixed(1)})</label>
        <input type="range" id="pb_max" name="pb_max" min="0.5" max="5" step="0.1" value={criteria.pb_max} onChange={handleChange} />
      </div>

      <div className="control-group">
        <label htmlFor="de_max">Dette/Fonds Propres max ({criteria.de_max})</label>
        <input type="range" id="de_max" name="de_max" min="10" max="300" value={criteria.de_max} onChange={handleChange} />
      </div>

      <div className="control-group">
        <label htmlFor="roe_min">ROE minimum ({(criteria.roe_min * 100).toFixed(0)}%)</label>
        <input type="range" id="roe_min" name="roe_min" min="0" max="0.3" step="0.01" value={criteria.roe_min} onChange={handleChange} />
      </div>
      
      <hr style={{margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-color)'}}/>

      <button onClick={onRunAnalysis} disabled={isLoading} className="main-button">
        {isLoading ? 'Analyse en cours...' : "Lancer l'analyse"}
      </button>
    </aside>
  );
}