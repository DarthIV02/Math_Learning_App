const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('../../db/pool');

function escapeSqlString(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    return val;
}

async function exportToSql(source = 'gsm8k') {
    
    const outputPath = path.join(__dirname, `${source}-cache.sql`);

    try {
        console.log(`📥 Querying database for source: ${source}...`);
        
        // 1. Fetch seed_problems data
        const problemsResult = await db.query(
            `SELECT 
                id, source, external_id, grade, question_text, answer_text, 
                correct_answers, topic, primary_unit, extracted_variables, 
                number_range_id, operation_category_id, unknown_position_id, 
                linguistic_complexity_id, cognitive_demand_id, operation_count_id, 
                ai_full_return 
            FROM seed_problems WHERE source = $1`, 
            [source]
        );
        
        const problemRows = problemsResult.rows;

        if (problemRows.length === 0) {
            console.log('⚠️ No rows found to export.');
            return;
        }

        // 2. Fetch the associated junction table records for this source dataset
        const operationsResult = await db.query(
            `SELECT p.source, p.external_id, spo.operation_id 
             FROM seed_problem_operations spo
             JOIN seed_problems p ON spo.seed_problem_id = p.id
             WHERE p.source = $1`,
            [source]
        );
        
        const operationRows = operationsResult.rows;

        console.log(`🔄 Generating bulk SQL insert for ${problemRows.length} problems and ${operationRows.length} operations mappings...`);

        // --- BUILD SEED PROBLEMS SQL ---
        const columns = [
            'source', 'external_id', 'grade', 'question_text', 'answer_text', 
            'correct_answers', 'topic', 'primary_unit', 'extracted_variables', 
            'number_range_id', 'operation_category_id', 'unknown_position_id', 
            'linguistic_complexity_id', 'cognitive_demand_id', 'operation_count_id', 
            'ai_full_return'
        ];

        const problemValueBlocks = problemRows.map(row => {
            const values = [
                escapeSqlString(row.source),
                escapeSqlString(row.external_id),
                row.grade !== null && row.grade !== undefined ? row.grade : 'NULL',
                escapeSqlString(row.question_text),
                escapeSqlString(row.answer_text),
                escapeSqlString(row.correct_answers),
                escapeSqlString(row.topic),
                escapeSqlString(row.primary_unit),
                escapeSqlString(row.extracted_variables),
                row.number_range_id || 'NULL',
                row.operation_category_id || 'NULL',
                row.unknown_position_id || 'NULL',
                row.linguistic_complexity_id || 'NULL',
                row.cognitive_demand_id || 'NULL',
                row.operation_count_id || 'NULL',
                escapeSqlString(row.ai_full_return)
            ];
            return `  (${values.join(', ')})`;
        });

        let sqlContent = `-- Generated automatically by bulk export script\n`;
        sqlContent += `-- Source: ${source} cache\n\n`;
        sqlContent += `INSERT INTO seed_problems (\n  ${columns.join(', ')}\n)\nVALUES\n`;
        sqlContent += problemValueBlocks.join(',\n');
        sqlContent += `\nON CONFLICT (source, external_id) DO NOTHING;\n\n`;

        // --- BUILD SEED PROBLEM OPERATIONS SQL ---
        if (operationRows.length > 0) {
            sqlContent += `-- Many-to-Many Relationships: seed_problem_operations\n`;
            sqlContent += `INSERT INTO seed_problem_operations (seed_problem_id, operation_id)\nVALUES\n`;

            const operationValueBlocks = operationRows.map(row => {
                // Dynamically resolve the ID via subquery matching business keys
                const targetIdSubquery = `(SELECT id FROM seed_problems WHERE source = ${escapeSqlString(row.source)} AND external_id = ${escapeSqlString(row.external_id)})`;
                return `  (${targetIdSubquery}, ${row.operation_id})`;
            });

            sqlContent += operationValueBlocks.join(',\n');
            sqlContent += `\nON CONFLICT (seed_problem_id, operation_id) DO NOTHING;\n`;
        }

        // --- WRITE FILE ---
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, sqlContent, 'utf-8');
        
        console.log(`\n💾 Success! Created bulk SQL seeds file with junction mapping at:\n👉 ${outputPath}`);

    } catch (error) {
        console.error('❌ Failed to export SQL backup:', error);
    } finally {
        if (db && typeof db.end === 'function') {
            await db.end();
        }
    }
}

const source_dataset = process.argv[2] || 'gsm8k'; 
exportToSql(source_dataset);