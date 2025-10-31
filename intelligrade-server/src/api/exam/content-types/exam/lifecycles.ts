// @ts-nocheck

export default {
    async beforeDelete(event) {
        console.log('beforeDelete exam');
        const { params } = event;
        const { where } = params;

        // 获取将要被删除的exam的ID
        const examToDelete = await strapi.entityService.findOne('api::exam.exam', where.id);

        if (examToDelete) {
            // 查找所有关联到这个exam的schedule记录
            const schedulesToDelete = await strapi.entityService.findMany('api::schedule.schedule', {
                filters: {
                    exam: examToDelete.id,
                },
            });

            // 删除找到的所有schedule记录
            for (const schedule of schedulesToDelete) {
                await strapi.entityService.delete('api::schedule.schedule', schedule.id);
            }

            strapi.log.info(`已删除与exam(ID: ${examToDelete.id})关联的${schedulesToDelete.length}个schedule记录`);
        }
    },
}; 