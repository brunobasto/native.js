// Tells compiler about our globals
declare var Analog: any;
declare var serialRead: any;

// TODO: Support classes
// interface Thermistor {
// 	analogPin: number;
// }

// class MyThermistor implements Thermistor {
// 	analogPin = 0;
// }

const thermistor = {
  analogPin: 0,
  coefficient: -3950,
  nominalResistance: 100000,
  nominalTemperature: 25,
  numberOfSamples: 1000,
  seriesResistor: 99000
};

function readThermistor() {
  // Read some samples and take the average
  const { numberOfSamples } = thermistor;
  let reading = 0;
  for (let i = 0; i < numberOfSamples; i++) {
    reading += Analog.read(thermistor.analogPin);
  }
  reading /= numberOfSamples;
  // Convert the value to resistance
  reading = 1023 / reading - 1;
  reading = thermistor.seriesResistor / reading;
  // Apply Steinhart to translate that into a temperature
  let steinhart = reading / thermistor.nominalResistance; // (R/Ro)
  steinhart = Math.log(steinhart); // ln(R/Ro)
  steinhart /= thermistor.coefficient; // 1/B * ln(R/Ro)
  steinhart += 1 / (thermistor.nominalTemperature + 273.15); // + (1/To)
  steinhart = 1 / steinhart; // Invert
  steinhart -= 273.15; // convert to Celsius
  return steinhart;
}
const command = "XXXXXXXXXXXXXXXXX";
// setInterval(() => {
// for now we need to init a string that can hold the command length

// }, 250);
while (true) {
  serialRead(command);
  console.log("command read", command);
  if (command.indexOf("GET_TEMPERATURE") > -1) {
    console.log(readThermistor());
  }
}
