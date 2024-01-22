#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <PubSubClient.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

#define TrigPin 12
#define EchoPin 14

/********** WiFi Connection Details **********/
const char* ssid = "DTEL_ALBERES_2.4";
const char* password = "#mfdo1983@";

/********** MQTT Broker Connection Details **********/
const char* mqtt_server = "broker.hivemq.com"; // public MQTT broker
const char* mqtt_username = "your_mqtt_client_username";
const char* mqtt_password = "your_mqtt_client_password";
const int mqtt_port = 1883; // Porta padrão para MQTT sem TLS

/********** NTP Client Setup **********/
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

/********** MQTT Client Setup **********/
WiFiClient espClient; // Alteração para WiFiClient ao invés de WiFiClientSecure
HTTPClient http;
PubSubClient client(espClient);

/********** Global State Variables **********/
int updateInterval = 10000;
const int pinA0 = A0;

struct Device {
  String macAddress;
  int height;
};

// 0.5 height, 0.65 base radius, 665 l

Device device = {
  "00:1B:44:11:3A:B7",
  50,
};

/************* Connect to WiFi ***********/
void setupWiFi() {
  delay(10);
  // Serial.print("\nConnecting to ");
  // Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    // Serial.print(".");
  }

  // Serial.println("\nWiFi connected\nIP address: ");
  // Serial.println(WiFi.localIP());
}

float readDistanceSensor() {
  digitalWrite(TrigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(TrigPin, HIGH);
  delayMicroseconds(10);
  
  float durationindigit = pulseIn(EchoPin, HIGH);
  return (durationindigit / 2) / 29.1;
}

float readVoltageSensor() {
  int nVoltageRaw = analogRead(A0);
  return nVoltageRaw;
}

void verifyAdaptation(const char* host, const char* endpoint) {
  String macAddress = device.macAddress;
  // Serial.print("Conectando a: ");
  // Serial.println(host);

  int attempts = 0;
  const int maxAttempts = 5; // Número máximo de tentativas de conexão

  while (attempts < maxAttempts) {
    if (!WiFi.isConnected()) {
      Serial.println("Reconectando ao Wi-Fi...");
      WiFi.reconnect();
      delay(1000); // Aguarde um momento para a conexão ser reestabelecida
    }

    if (!http.begin(espClient, "http://192.168.18.220:3001/managing-system/00:1B:44:11:3A:B7")) {
      Serial.println("Falha ao iniciar a conexão");
      delay(1000); // Aguarde antes de tentar novamente
      attempts++;
      continue; // Tenta novamente
    }

    http.setTimeout(10000); // Ajuste do tempo limite para 10 segundos

    int httpCode = http.GET();

    if (httpCode < 0) {
      Serial.println("Erro na requisição - " + String(http.errorToString(httpCode).c_str()));
      http.end();
      delay(1000); // Aguarde antes de tentar novamente
      attempts++;
      continue; // Tenta novamente
    }

    if (httpCode != HTTP_CODE_OK) {
      Serial.println("Erro na resposta do servidor - Código: " + String(httpCode));
      http.end();
      delay(1000); // Aguarde antes de tentar novamente
      attempts++;
      continue; // Tenta novamente
    }

     String payload = http.getString();
  
    // Criando um objeto JSON para analisar o payload
    StaticJsonDocument<200> jsonDocument; // 200 é o tamanho do buffer
  
    // Analisando o payload e verificando se foi feita com sucesso
    DeserializationError error = deserializeJson(jsonDocument, payload);

    if (error) {
      Serial.println("Falha na análise JSON");
      http.end();
      return;
    }

    Serial.println("##[RESULT]## ==> " + payload);

    int deepSleepValue = jsonDocument["deepSleep"];

    executor(deepSleepValue);
    http.end();
    return; // Conexão bem-sucedida, sai da função
  }

  Serial.println("Não foi possível estabelecer a conexão após várias tentativas.");
}

void monitor(){
  int currentHour = timeClient.getHours();
  analyser(currentHour);
}

void analyser(int hour){
  // Verifica se a hora está entre meia noite (0h) e cinco da manhã (5h)
  if (hour >= 0 && hour < 5) {
    Serial.println("A hora está entre meia noite e cinco da manhã.");
    // Faça o que precisa ser feito durante este intervalo de tempo
    // Pode ser retornado true aqui se necessário
    executor(3600);
  } else {
    verifyAdaptation("192.168.18.220:3001", "/managing-system");
    //  chamar requisição HTTP para aquamon e verificar se tem adaptação por volume
  }
}

void executor(int sleepTime){
  Serial.println(sleepTime);
  updateInterval = sleepTime;
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");

      client.subscribe("led_state"); // subscribe the topics here

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  unsigned long startTime;  // Variável para armazenar o tempo de início
  Serial.begin(9600);
  Serial.setTimeout(2000);
  
  pinMode(TrigPin, OUTPUT);
  pinMode(EchoPin, INPUT);

  setupWiFi();

  client.setServer(mqtt_server, mqtt_port);
  
  timeClient.begin();

  // Obter o tempo de início
  startTime = millis();

  timeClient.setTimeOffset(-10800);

  execute();


  // Calcular o tempo decorrido e imprimir
  unsigned long elapsedTime = millis() - startTime;
  Serial.print("Tempo de execução: ");
  Serial.print(elapsedTime);
  Serial.println(" ms");

  ESP.deepSleep(updateInterval * 1000000);
}

void execute(){
  if (!client.connected()) reconnect();
  client.loop();

  timeClient.update();
  
  unsigned long timestamp = timeClient.getEpochTime();

  int currentHour = timeClient.getHours();

  float distance = readDistanceSensor();
  float voltage = readVoltageSensor();

  Serial.print("\t Voltagem lida: ");
  Serial.print(voltage);

  Serial.print("\t Distancia lida: ");
  Serial.print(distance);

  String macAddress = device.macAddress;
  String message = "{\"distance\": " + String(distance) + ", \"voltage\": " + String(voltage) + ", \"timestamp\": " + String(timestamp) + "}";

  // Serial.print("\t Enviando mensagem para o tópico: ");
  // Serial.println(macAddress);
  // Serial.print("Mensagem: ");
  // Serial.println(message);

  client.publish(macAddress.c_str(), message.c_str());

  monitor();

  digitalWrite(LED_BUILTIN, HIGH);
}

void loop() {}