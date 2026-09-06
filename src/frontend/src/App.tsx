import ActivityTimeline from './components/ActivityTimeline.js';
import SstvGallery from './components/SstvGallery.js';
import StatusPanel from './components/StatusPanel.js';
import Waterfall from './components/Waterfall.js';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">two-meter-watch</h1>
        <p className="text-slate-400 text-sm">Public 2-meter amateur band (144-146MHz) monitor</p>
      </header>

      <StatusPanel />
      <Waterfall />
      <ActivityTimeline />
      <SstvGallery />
    </div>
  );
}
