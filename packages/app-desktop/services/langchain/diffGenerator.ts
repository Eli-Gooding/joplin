

export interface DiffRange {
    startLine: number;
    endLine: number;
    originalText: string;
    newText: string;
}

export interface DiffOperation {
    id: string;
    timestamp: Date;
    noteId: string;
    originalContent: string;
    newContent: string;
    ranges: DiffRange[];
}

export class DiffGenerator {
    /**
     * Generate a diff between two strings using longest common subsequence
     */
    private generateDiff(original: string, modified: string): DiffRange[] {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        
        // Get LCS matrix
        const lcsMatrix = this.buildLCSMatrix(originalLines, modifiedLines);
        
        // Extract changes from the LCS matrix
        const ranges: DiffRange[] = [];
        let currentRange: DiffRange | null = null;
        
        let i = originalLines.length;
        let j = modifiedLines.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
                if (currentRange) {
                    ranges.unshift(currentRange);
                    currentRange = null;
                }
                i--;
                j--;
            } else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
                // Addition
                if (!currentRange) {
                    currentRange = {
                        startLine: i,
                        endLine: i,
                        originalText: '',
                        newText: ''
                    };
                }
                currentRange.newText = modifiedLines[j - 1] + '\n' + currentRange.newText;
                j--;
            } else if (i > 0 && (j === 0 || lcsMatrix[i][j - 1] < lcsMatrix[i - 1][j])) {
                // Deletion
                if (!currentRange) {
                    currentRange = {
                        startLine: i - 1,
                        endLine: i,
                        originalText: '',
                        newText: ''
                    };
                }
                currentRange.originalText = originalLines[i - 1] + '\n' + currentRange.originalText;
                currentRange.endLine = i;
                i--;
            }
        }
        
        if (currentRange) {
            ranges.unshift(currentRange);
        }
        
        return ranges;
    }
    
    /**
     * Build the LCS matrix for diff generation
     */
    private buildLCSMatrix(originalLines: string[], modifiedLines: string[]): number[][] {
        const matrix: number[][] = Array(originalLines.length + 1)
            .fill(0)
            .map(() => Array(modifiedLines.length + 1).fill(0));
        
        for (let i = 1; i <= originalLines.length; i++) {
            for (let j = 1; j <= modifiedLines.length; j++) {
                if (originalLines[i - 1] === modifiedLines[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1] + 1;
                } else {
                    matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                }
            }
        }
        
        return matrix;
    }
    
    /**
     * Create a new diff operation for a note edit
     */
    createDiffOperation(noteId: string, originalContent: string, newContent: string): DiffOperation {
        const ranges = this.generateDiff(originalContent, newContent);
        
        return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            noteId,
            originalContent,
            newContent,
            ranges
        };
    }
}
