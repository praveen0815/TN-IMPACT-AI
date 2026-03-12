import * as math from 'mathjs';

export interface SimulationResult {
  scenario: string;
  stockoutProbability: number;
  expectedDelay: number;
  financialImpact: number;
  recoveryTime: number;
  iterations: number;
}

export const runMonteCarlo = (scenario: string, baseDelay: number, baseImpact: number): SimulationResult => {
  const iterations = 10000;
  const delays: number[] = [];
  const impacts: number[] = [];
  let stockouts = 0;

  for (let i = 0; i < iterations; i++) {
    // Normal distribution for variability
    const delayVar = math.random(-2, 5); 
    const impactVar = math.random(0.8, 1.5);
    
    const currentDelay = Math.max(0, baseDelay + delayVar);
    const currentImpact = baseImpact * impactVar;

    delays.push(currentDelay);
    impacts.push(currentImpact);

    if (currentDelay > 10) stockouts++; // Threshold for stockout
  }

  return {
    scenario,
    stockoutProbability: (stockouts / iterations) * 100,
    expectedDelay: math.mean(delays),
    financialImpact: math.mean(impacts),
    recoveryTime: math.max(delays) * 1.5,
    iterations
  };
};

export const simulatePropagation = (nodes: any[], edges: any[], startNodeId: number) => {
  // Simple BFS to simulate risk propagation in the digital twin
  const propagation: any[] = [];
  const visited = new Set();
  const queue = [{ id: startNodeId, delay: 0, impact: 100 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    propagation.push(current);

    const connectedEdges = edges.filter(e => e.from === current.id);
    for (const edge of connectedEdges) {
      queue.push({
        id: edge.to,
        delay: current.delay + edge.leadTime,
        impact: current.impact * 0.8 // Impact dissipates or compounds
      });
    }
  }

  return propagation;
};
