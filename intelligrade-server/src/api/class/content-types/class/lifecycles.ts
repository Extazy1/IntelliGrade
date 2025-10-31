// @ts-nocheck

export default {
    async beforeDelete(event) {
        console.log('beforeDelete');
        const { params } = event;
        const { where } = params;

        // 获取将要被删除的class的ID
        const classToDelete = await strapi.entityService.findOne('api::class.class', where.id);

        if (classToDelete) {
            // 查找所有关联到这个class的schedule记录
            const schedulesToDelete = await strapi.entityService.findMany('api::schedule.schedule', {
                filters: {
                    class: classToDelete.id,
                },
            });

            // 删除找到的所有schedule记录
            for (const schedule of schedulesToDelete) {
                await strapi.entityService.delete('api::schedule.schedule', schedule.id);
            }

            strapi.log.info(`已删除与class(ID: ${classToDelete.id})关联的${schedulesToDelete.length}个schedule记录`);
        }
    },
}; 