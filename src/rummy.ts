import lock from "./main/lock";
(async () => {
  const config = await import("./connections/config");
  const logger = await import("./logger");
  const { socketOps, httpServer, mongo, rdsOps } = await import(
    "./connections"
  );
  (async () => {
    try {
      const configData = config.default();
      // logger.info("--->> config :: ", configData);

      const { SERVER_TYPE, HTTP_SERVER_PORT } = configData;
      const promise = await Promise.all([
        // mongo.init(),
        rdsOps.init(),
        socketOps.createSocketServer(),
      ]);

      const { client } = promise[0];
      await lock.init(client);

      httpServer.listen(HTTP_SERVER_PORT, () => {
        logger.info(
          `${SERVER_TYPE} Server listening to the port ${HTTP_SERVER_PORT}`
        );
      });
    } catch (error) {
      console.trace(error);
      logger.error(`Server listen error ${error}`);
    }
  })();
  process
    .on("unhandledRejection", (reason, p) => {
      console.log(reason);
      console.log(p);
      logger.error(
        reason,
        "Unhandled Rejection at Promise >> ",
        new Date(),
        " >> ",
        p
      );
    })
    .on("uncaughtException", (err) => {
      logger.error("Uncaught Exception thrown", new Date(), " >> ", "\n", err);
    });
})();
