import React, { useState, useEffect, useRef } from 'react';
import { Shield, Server, Activity, Settings, AlertTriangle, Check, Network, Users } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ServerConfig {
  cpu: number;
  ram: number;
  bandwidth: number;
  storage: number;
}

interface SecurityMeasures {
  fail2ban: boolean;
  pfsense: boolean;
  cloudflare: boolean;
  loadBalancer: boolean;
  waf: boolean;
}

interface MetricPoint {
  timestamp: number;
  value: number;
}

function App() {
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    cpu: 4,
    ram: 16,
    bandwidth: 1000,
    storage: 500
  });

  const [security, setSecurity] = useState<SecurityMeasures>({
    fail2ban: false,
    pfsense: false,
    cloudflare: false,
    loadBalancer: false,
    waf: false
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [attackIntensity, setAttackIntensity] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [serverLoad, setServerLoad] = useState(0);
  const [legitimateTraffic, setLegitimateTraffic] = useState(0);
  const [maliciousTraffic, setMaliciousTraffic] = useState(0);

  useEffect(() => {
    if (!isSimulating) {
      setMetrics([]);
      return;
    }

    const interval = setInterval(() => {
      const timestamp = Date.now();
      const protectionLevel = Object.values(security).filter(Boolean).length;
      const baseLoad = attackIntensity * (1 - protectionLevel * 0.15);
      const randomVariation = Math.random() * 20 - 10;
      const value = Math.max(0, Math.min(100, baseLoad + randomVariation));

      setMetrics(prev => [...prev.slice(-30), { timestamp, value }]);
      
      // Calculer la charge du serveur
      const serverCapacity = (serverConfig.cpu * 10 + serverConfig.ram * 2 + serverConfig.bandwidth / 100) / 3;
      const newServerLoad = Math.min(100, (value / serverCapacity) * 100);
      setServerLoad(newServerLoad);

      // Calculer le trafic légitime vs malicieux
      const totalTraffic = attackIntensity * 2;
      const blockedTraffic = totalTraffic * (protectionLevel * 0.2);
      setMaliciousTraffic(totalTraffic - blockedTraffic);
      setLegitimateTraffic(50 + Math.random() * 20);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, attackIntensity, security, serverConfig]);

  useEffect(() => {
    if (!isSimulating || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{x: number; y: number; speed: number; color: string; type: 'attack' | 'legitimate'}> = [];
    const particleCount = 100;

    const resetParticle = (particle: any, forceType?: 'attack' | 'legitimate') => {
      particle.x = 0;
      particle.y = Math.random() * canvas.height;
      particle.speed = 2 + Math.random() * 3;
      particle.type = forceType || (Math.random() > 0.7 ? 'legitimate' : 'attack');
      
      const protectionLevel = Object.values(security).filter(Boolean).length;
      if (particle.type === 'legitimate') {
        particle.color = '#22c55e';
      } else if (protectionLevel >= 4) {
        particle.color = '#ef4444';
        particle.speed *= 0.3;
      } else if (protectionLevel >= 2) {
        particle.color = '#eab308';
        particle.speed *= 0.6;
      } else {
        particle.color = '#ef4444';
      }
    };

    // Initialisation des particules
    for (let i = 0; i < particleCount; i++) {
      const particle = { x: 0, y: 0, speed: 0, color: '#ef4444', type: 'attack' as const };
      resetParticle(particle);
      particles.push(particle);
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(17, 24, 39, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner les lignes de connexion
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;

      particles.forEach(particle => {
        if (particle.type === 'legitimate' && particle.x > canvas.width * 0.8) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      });

      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.type === 'legitimate' ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        particle.x += particle.speed;

        if (particle.x > canvas.width) {
          resetParticle(particle);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      particles = [];
    };
  }, [isSimulating, security]);

  const getProtectionScore = () => {
    const measures = Object.values(security).filter(Boolean).length;
    return (measures / 5) * 100;
  };

  const chartData = {
    labels: metrics.map(() => ''),
    datasets: [
      {
        label: 'Charge du serveur',
        data: metrics.map(m => m.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        display: false
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Simulateur de Sécurité Réseau
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Configuration du Serveur
            </h2>
            
            <div className="space-y-4">
              {Object.entries(serverConfig).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300 capitalize">
                    {key === 'cpu' ? 'CPU (cores)' :
                     key === 'ram' ? 'RAM (GB)' :
                     key === 'bandwidth' ? 'Bande passante (Mbps)' :
                     'Stockage (GB)'}
                  </label>
                  <input
                    type="range"
                    min={key === 'cpu' ? 1 : 1}
                    max={key === 'cpu' ? 32 : 
                         key === 'ram' ? 128 :
                         key === 'bandwidth' ? 10000 :
                         2000}
                    value={value}
                    onChange={(e) => setServerConfig(prev => ({
                      ...prev,
                      [key]: parseInt(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-400">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Mesures de Sécurité
            </h2>
            
            <div className="space-y-4">
              {Object.entries(security).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={() => setSecurity(prev => ({
                      ...prev,
                      [key]: !prev[key]
                    }))}
                    className="w-5 h-5 rounded border-gray-600"
                  />
                  <label htmlFor={key} className="text-sm text-gray-300 capitalize">
                    {key === 'waf' ? 'Web Application Firewall' : key}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Charge du Serveur en Temps Réel
              </h2>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-4 py-2 rounded-lg ${
                  isSimulating 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                {isSimulating ? 'Arrêter' : 'Démarrer'} la simulation
              </button>
            </div>

            <div className="h-[200px] mb-4">
              <Line data={chartData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm text-gray-300 mb-1">Charge CPU</h3>
                <div className="text-2xl font-bold">{serverLoad.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm text-gray-300 mb-1">Trafic Légitime</h3>
                <div className="text-2xl font-bold text-green-500">{legitimateTraffic.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm text-gray-300 mb-1">Trafic Malicieux</h3>
                <div className="text-2xl font-bold text-red-500">{maliciousTraffic.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Network className="w-5 h-5" />
              Visualisation du Trafic
            </h2>
            
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="w-full h-[300px] bg-gray-900 rounded-lg mb-4"
            />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-300">Trafic légitime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-300">Attaques DDoS</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-300 block mb-2">
                Intensité de l'attaque:
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={attackIntensity}
                onChange={(e) => setAttackIntensity(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-400">{attackIntensity}%</span>
            </div>
          </div>
        </div>

        {isSimulating && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Analyse en Direct
            </h2>
            
            <div className="space-y-2 text-sm text-gray-300">
              {security.fail2ban && (
                <p>• Fail2ban: Blocage des tentatives d'accès malveillantes</p>
              )}
              {security.pfsense && (
                <p>• pfSense: Filtrage du trafic et détection d'intrusion</p>
              )}
              {security.cloudflare && (
                <p>• Cloudflare: Protection DDoS et CDN</p>
              )}
              {security.loadBalancer && (
                <p>• Load Balancer: Distribution de charge et haute disponibilité</p>
              )}
              {security.waf && (
                <p>• WAF: Protection contre les attaques web</p>
              )}
              
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">État du Système</h3>
                <p>Capacité de traitement: {Math.min(100, 
                  (serverConfig.cpu * 10 + 
                   serverConfig.ram * 2 + 
                   serverConfig.bandwidth / 100) / 3
                ).toFixed(0)}%</p>
                <p>Niveau de protection: {getProtectionScore().toFixed(0)}%</p>
                <p className={`mt-2 font-semibold ${serverLoad > 90 ? 'text-red-500' : serverLoad > 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {serverLoad > 90 ? '⚠️ Système saturé' :
                   serverLoad > 70 ? '⚠️ Charge élevée' :
                   '✅ Système stable'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;