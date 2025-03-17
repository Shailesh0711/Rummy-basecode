import queues from "./queues"
import cancelJob from "./cancelJob";

const exportObject = {
    addJob: queues,
    cancelJob
}

export = exportObject