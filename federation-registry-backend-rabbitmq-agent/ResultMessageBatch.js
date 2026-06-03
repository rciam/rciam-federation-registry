class ResultMessageBatch {
  constructor() {
    this.messages = [];
  }

  addMessage(data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    const base64Data = Buffer.from(json).toString('base64');

    this.messages.push({
      message: {
        data: base64Data
      }
    });
  }

  isEmpty() {
    return this.messages.length === 0;
  }

  clear() {
    this.messages = [];
  }

  toJSON() {
    return {
      messages: this.messages
    };
  }
}

module.exports = ResultMessageBatch;
