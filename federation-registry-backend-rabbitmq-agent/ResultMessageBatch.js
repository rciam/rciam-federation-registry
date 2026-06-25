class ResultMessageBatch {
  constructor() {
    this.entries = []; // Stores both the fedreg payload and the AMQP message
  }

  addMessage(data, amqpMsg) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const base64Data = Buffer.from(json).toString('base64');

    this.entries.push({
      apiPayload: {
        message: {
          data: base64Data
        }
      },
      amqpMsg: amqpMsg
    });
  }

  isEmpty() {
    return this.entries.length === 0;
  }

  clear() {
    this.entries = [];
  }

  // Returns ONLY the structure fedreg expects
  toJSON() {
    return {
      messages: this.entries.map(entry => entry.apiPayload)
    };
  }

  // Expose the original messages so they can be ACKed
  getAmqpMessages() {
    return this.entries.map(entry => entry.amqpMsg);
  }
}

module.exports = ResultMessageBatch;
