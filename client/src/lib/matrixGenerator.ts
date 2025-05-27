import type { MatrixCell, DetectedStructure } from "@shared/schema";

export interface MatrixConfig {
  width: number;
  height: number;
  activeRatio: number;
  droppedRatio: number;
  pointerRatio: number;
}

export class MatrixGenerator {
  private config: MatrixConfig;

  constructor(config: MatrixConfig = {
    width: 12,
    height: 8,
    activeRatio: 0.4,
    droppedRatio: 0.2,
    pointerRatio: 0.2,
  }) {
    this.config = config;
  }

  generateFromStructures(structures: DetectedStructure[]): MatrixCell[] {
    const matrix: MatrixCell[] = [];
    
    if (structures.length === 0) {
      return this.generateDefaultMatrix();
    }

    // Calculate total instances across all structures
    const totalInstances = structures.reduce((sum, s) => sum + s.instances, 0);
    const cellsPerInstance = (this.config.width * this.config.height) / totalInstances;

    let currentY = 0;
    structures.forEach((structure, structIndex) => {
      const structureRows = Math.ceil(structure.instances * cellsPerInstance / this.config.width);
      
      for (let row = 0; row < structureRows && currentY < this.config.height; row++) {
        for (let x = 0; x < this.config.width; x++) {
          const cell = this.generateCellForStructure(x, currentY + row, structure, structIndex);
          matrix.push(cell);
        }
      }
      
      currentY += structureRows;
    });

    // Fill remaining cells if any
    while (matrix.length < this.config.width * this.config.height) {
      const remainingIndex = matrix.length;
      const x = remainingIndex % this.config.width;
      const y = Math.floor(remainingIndex / this.config.width);
      
      matrix.push({
        x,
        y,
        type: 'empty',
        tooltip: `Empty cell at (${x}, ${y})`,
      });
    }

    return matrix;
  }

  private generateCellForStructure(
    x: number, 
    y: number, 
    structure: DetectedStructure, 
    structIndex: number
  ): MatrixCell {
    const random = Math.random();
    let type: MatrixCell['type'];
    
    // Adjust probabilities based on structure type
    const typeMultiplier = this.getTypeMultiplier(structure.type);
    
    if (random < this.config.activeRatio * typeMultiplier.active) {
      type = 'active';
    } else if (random < (this.config.activeRatio + this.config.pointerRatio) * typeMultiplier.pointer) {
      type = 'pointer';
    } else if (random < (this.config.activeRatio + this.config.pointerRatio + this.config.droppedRatio) * typeMultiplier.dropped) {
      type = 'dropped';
    } else {
      type = 'empty';
    }

    return {
      x,
      y,
      type,
      value: type !== 'empty' ? `${structure.name}_${x}_${y}` : undefined,
      tooltip: `${structure.name} ${type} at (${x}, ${y})`,
    };
  }

  private getTypeMultiplier(structureType: string) {
    switch (structureType) {
      case 'linked_list':
        return { active: 1.2, pointer: 1.5, dropped: 1.0 };
      case 'nested':
        return { active: 1.0, pointer: 1.8, dropped: 1.3 };
      case 'simple':
        return { active: 1.5, pointer: 0.5, dropped: 0.8 };
      default:
        return { active: 1.0, pointer: 1.0, dropped: 1.0 };
    }
  }

  generateDefaultMatrix(): MatrixCell[] {
    const matrix: MatrixCell[] = [];
    
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const random = Math.random();
        let type: MatrixCell['type'];
        
        if (random < this.config.activeRatio) {
          type = 'active';
        } else if (random < this.config.activeRatio + this.config.pointerRatio) {
          type = 'pointer';
        } else if (random < this.config.activeRatio + this.config.pointerRatio + this.config.droppedRatio) {
          type = 'dropped';
        } else {
          type = 'empty';
        }

        matrix.push({
          x,
          y,
          type,
          value: type !== 'empty' ? `Node_${y}_${x}` : undefined,
          tooltip: `${type} cell at (${x}, ${y})`,
        });
      }
    }
    
    return matrix;
  }

  updateMatrixForStep(matrix: MatrixCell[], step: number): MatrixCell[] {
    // Simulate matrix changes as code execution progresses
    return matrix.map(cell => {
      // Add some randomness to simulate dynamic changes
      if (Math.random() < 0.05) { // 5% chance of change per step
        const newType = this.getRandomCellType();
        return {
          ...cell,
          type: newType,
          value: newType !== 'empty' ? cell.value : undefined,
        };
      }
      return cell;
    });
  }

  private getRandomCellType(): MatrixCell['type'] {
    const random = Math.random();
    if (random < 0.4) return 'active';
    if (random < 0.6) return 'pointer';
    if (random < 0.8) return 'dropped';
    return 'empty';
  }

  calculateMatrixStats(matrix: MatrixCell[]) {
    const stats = {
      total: matrix.length,
      active: 0,
      pointer: 0,
      dropped: 0,
      empty: 0,
    };

    matrix.forEach(cell => {
      stats[cell.type]++;
    });

    return {
      ...stats,
      efficiency: Math.round(((stats.active + stats.pointer) / stats.total) * 100),
      utilization: Math.round(((stats.total - stats.empty) / stats.total) * 100),
    };
  }
}

export const matrixGenerator = new MatrixGenerator();
