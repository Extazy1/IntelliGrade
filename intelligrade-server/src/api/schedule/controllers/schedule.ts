import { factories } from '@strapi/strapi'
import { startMatching } from '../../../utils/matching';
import { startObjective } from '../../../utils/objective';
import { startSubjective } from '../../../utils/subjective';
import { askSubjective } from '../../../utils/llm';
import { cwd } from 'process';
import path from 'path';
import { calcResult } from '../../../utils/calcResult';

export default factories.createCoreController('api::schedule.schedule', ({ strapi }) => ({
    async startMatching(ctx) {
        try {
            const { documentId } = ctx.params;

            if (!documentId) {
                return ctx.badRequest('documentId is required');
            }

            //启动一个异步任务，专门处理流水线
            startMatching(documentId);

            // 成功的返回值
            const result = {
                success: true,
                message: `Matching has been started for document ID ${documentId}`,
                documentId
            };
            return result;
        } catch (error) {
            ctx.throw(500, error);
        }
    },
    async startObjective(ctx) {
        try {
            const { documentId } = ctx.params;

            if (!documentId) {
                return ctx.badRequest('documentId is required');
            }

            startObjective(documentId);
            // 成功的返回值
            const result = {
                success: true,
                message: `Objective has been started for document ID ${documentId}`,
                documentId
            };
            return result;
        } catch (error) {
            ctx.throw(500, error);
        }
    },
    async startSubjective(ctx) {
        try {
            const { documentId } = ctx.params;

            if (!documentId) {
                return ctx.badRequest('documentId is required');
            }

            startSubjective(documentId);

            // 成功的返回值
            const result = {
                success: true,
                message: `Subjective has been started for document ID ${documentId}`,
                documentId
            };
            return result;
        } catch (error) {
            ctx.throw(500, error);
        }
    },
    async askSubjective(ctx) {
        try {
            const { question, answer, score, imageUrl } = ctx.request.body;
            const rootDir = cwd();
            
            console.log('[askSubjective] Received imageUrl:', imageUrl);
            
            let imagePath: string;
            
            // Check if imageUrl is already an absolute path
            if (path.isAbsolute(imageUrl)) {
                // If it's already absolute, use it directly
                imagePath = imageUrl;
                console.log('[askSubjective] Using absolute path:', imagePath);
            } else {
                // imageUrl is a relative path like 'pipeline/xxx/student-1/questions/xxx.png'
                const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                imagePath = path.join(rootDir, 'public', cleanImageUrl);
                console.log('[askSubjective] Constructed path from relative:', imagePath);
            }
            
            // Verify file exists
            const fs = require('fs');
            if (!fs.existsSync(imagePath)) {
                console.error('[askSubjective] File not found at:', imagePath);
                console.error('[askSubjective] rootDir:', rootDir);
                console.error('[askSubjective] Original imageUrl:', imageUrl);
                throw new Error(`Image file not found: ${imagePath}`);
            }
            
            const result = await askSubjective({ question, answer, score, imageUrl: imagePath });
            return result;
        } catch (error) {
            console.error('[askSubjective] Error:', error);
            ctx.throw(500, error);
        }
    },
    async calcResult(ctx) {
        try {
            const { documentId } = ctx.params;

            if (!documentId) {
                return ctx.badRequest('documentId is required');
            }

            calcResult(documentId);

            // 成功的返回值
            const result = {
                success: true,
                message: `Result has been calculated for document ID ${documentId}`,
                documentId
            };
            return result;
        } catch (error) {
            ctx.throw(500, error);
        }
    }
}));
