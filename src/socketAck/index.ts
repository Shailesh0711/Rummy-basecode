// @ts-ignore
function ackMid(en, response, userId, tableId, ack) {
    try {
        if (response && 'tableId' in response && response.success)
            delete response.tableId;

        ack(
            JSON.stringify({
                en: en,
                data: response,
                // metrics: metrics,
                userId,
                tableId,
            }),
        );

    } catch (error) {
        console.log('CATCH_ERROR in ackMid: ', error);
        // @ts-ignore
        throw new Error('ackMid error catch  : ', error);
    }
}

const exportObject = {
    ackMid,
};

export = exportObject;