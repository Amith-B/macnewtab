class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastOut = 0;
  }
  process(inputs, outputs) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        this.lastOut = (this.lastOut + 0.02 * white) / 1.02;
        channel[i] = this.lastOut * 3.5;
      }
    });
    return true;
  }
}
registerProcessor("brown-noise", BrownNoiseProcessor);

class PinkNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
  }
  process(inputs, outputs) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        this.b0 = 0.99886 * this.b0 + white * 0.0555179;
        this.b1 = 0.99332 * this.b1 + white * 0.0750759;
        this.b2 = 0.969 * this.b2 + white * 0.153852;
        this.b3 = 0.8665 * this.b3 + white * 0.3104856;
        this.b4 = 0.55 * this.b4 + white * 0.5329522;
        this.b5 = -0.7616 * this.b5 - white * 0.016898;
        channel[i] =
          this.b0 +
          this.b1 +
          this.b2 +
          this.b3 +
          this.b4 +
          this.b5 +
          this.b6 +
          white * 0.5362;
        channel[i] *= 0.11;
        this.b6 = white * 0.115926;
      }
    });
    return true;
  }
}
registerProcessor("pink-noise", PinkNoiseProcessor);

class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    });
    return true;
  }
}
registerProcessor("white-noise", WhiteNoiseProcessor);

class VioletNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastWhite = 0;
  }
  process(inputs, outputs) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        channel[i] = white - this.lastWhite;
        this.lastWhite = white;
        channel[i] *= 0.5; // Compensate for gain
      }
    });
    return true;
  }
}
registerProcessor("violet-noise", VioletNoiseProcessor);

class BlueNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastWhite = 0;
  }
  process(inputs, outputs) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        channel[i] = white - this.lastWhite;
        this.lastWhite = white;
        channel[i] *= 0.1; // Blue is harsh, lower gain
      }
    });
    return true;
  }
}
registerProcessor("blue-noise", BlueNoiseProcessor);
