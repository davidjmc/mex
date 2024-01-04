import machine, os, sys

try:
    import utime as time
except:
    import time
    
try:
    import configurations
except:
    pass

try:
  import adl as adl
except:
  pass

import ujson

from ntptime import settime # NTP Server
settime()

class Amot:
    
    @staticmethod
    def configApp(conf):
        return AmotEngine.getInstance().config(conf, mode='App')
    
    @staticmethod
    def configEnv(conf):
        return AmotEngine.getInstance().config(conf, mode='Env')
    
    @staticmethod
    def proxy():
        return AmotEngine.getInstance().starter()

    @staticmethod
    def attached(component):
        return AmotEngine.getInstance().attached(component)

    @staticmethod
    def env(data):
        return AmotEngine.getInstance().conf.get(data)
    
    @staticmethod
    def agent():
        return AmotEngine.getInstance().agent
    
    @staticmethod
    def instance():
        return AmotEngine.getInstance()
    
    @staticmethod
    def deep_sleep(tm):
        return AmotEngine.getInstance().deep_sleep(tm)
    
    @staticmethod
    def restartAndReconnect():
        print('Failed to start the device. Reconnecting...')
        AmotEngine.getInstance().restartAndReconnect()
        

class AmotEngine:
    _instance = None

    @staticmethod
    def setInstanceWith(ip, agent, conf):
        if AmotEngine._instance == None:
            AmotEngine._instance = AmotEngine(ip, agent, conf)

    @staticmethod
    def getInstance():
        return AmotEngine._instance
    
    def config(self, conf, mode):
        if mode == 'App':
            return configurations.configurations['application'][conf]
        elif mode == 'Env':
            return configurations.configurations['environment'][conf]
        else:
            return configurations.configurations['device'][conf]
        
    def starter(self):
        return self.current_components[self.configuration['start']]
    
    def attached(self, component):
        class_name = component.__class__.__name__
        next_class = self.attachments.get(class_name)
        next_object = self.current_components[next_class]
        return next_object
    
    def setAdaptationTime(self):
        tm = time.time()
        adaptation_time = (tm-10800)
        d = self.getAdaptationTime()
        d['1'] = str(adaptation_time)
        self.rtc.memory(ujson.dumps(d))
        # print('Set Adaptation Time = {0}'.format(d))
        
    def getAdaptationTime(self):
        if self.rtc.memory() == b'':
            d = {1: ''}
            self.rtc.memory(ujson.dumps(d))
        r = ujson.loads(self.rtc.memory())
        # print('Get Last Adaptation Time = {0}'.format(r))
        return r
    
    @staticmethod
    def restartAndReconnect():
        print('Failed to start the device. Reconnecting...')
        time.sleep(5)
        machine.reset()
        
    def deep_sleep(self, msecs):
        # configure RTC.ALARM0 to be able to wake the device
        rtc = machine.RTC()
        rtc.irq(trigger=rtc.ALARM0, wake=machine.DEEPSLEEP)
        # set RTC.ALARM0 to fire after X milliseconds (waking the device)
        rtc.alarm(rtc.ALARM0, msecs)
        # put the device to sleep
        machine.deepsleep()
    
    def checkAdaptation(self): 
        adaptation_time = (time.time()-10800)
        last_adaptation = self.getAdaptationTime()
        # #last = last_adaptation.decode('ascii')
        last = last_adaptation['1']
        
        if (self.adaptability['type'] not in ['', None] 
        and (adaptation_time - int(last)) > self.adaptability['timeout']):
            isthere_adaptation = self.agent.adapt()
            if isthere_adaptation:
                self.reload_components()
            self.setAdaptationTime()

    
    def __init__(self, ip, agent, conf):
        global start
        self.ip = ip
        self.conf = conf
        self.app = None
        self.agent = agent
        self.rtc = machine.RTC()
        self.last_adapt = 0

        self.current_components = self.loadComponents()
        self.attachments = adl.adl['attachments']
        self.configuration = adl.adl['configuration']
        self.adaptability = adl.adl['adaptability']
        
    def loadComponents(self):
        current_components = {}
        components = adl.adl['components']
        for component in components:
            component_file = components.get(component)
            namespace = __import__('components.' + component_file)
            component_module = getattr(namespace, component_file)
            component_instance = getattr(component_module, component)
            current_components[component] = component_instance()
        return current_components

    def run(self, app):
        start_time = time.ticks_ms()
        
        ##if self.app is None:
        self.app = app
        
        # adaptation settings
        last_adaptation = self.getAdaptationTime()            
        # print('Last Adaptation: {0}'.format(last_adaptation))

        if last_adaptation['1'] == '':
            self.setAdaptationTime()
        
        ## amot factory version
        #if self.last_adapt == 0:
            #self.last_adapt = time.time()
        
        # setup function runs once to initialize the environment of the application
        self.app.setup()
        
        
        while True:
            try:
                
                
                # application execution loop
                self.app.loop()
                                                
                # adaptation check
                self.checkAdaptation()                
                
                # self.checkAdapt()
                
                ##stop = time.time()
                end_time = time.ticks_ms()
                elapsed_time = time.ticks_diff(end_time, start_time)
                #elapsed_time_ms = (elapsed_time / time.ticks_ms()) * 1000 
                
                with open('framot-60s-freq.txt', "a") as f:
                    f.write("Elapsed time: {} ms".format(elapsed_time) + "\n")
            
                #d = self.getAdaptationTime()
                #print('start = {0} and stop = {1}'.format(self.conf['START_TIME'], stop))
                #d['2'] = str(stop-(self.conf['START_TIME']-10800))
                #self.rtc.memory(ujson.dumps(d))
                #print('Memory Format = {0}'.format(d))
                #mrtc = ujson.loads(self.rtc.memory())
                #print('start = {0} and stop = {1}'.format(self.conf['START_TIME'], stop))
                # self.d[2] = str(stop-(self.conf['START_TIME']-10800))
                # self.rtc.memory(ujson.dumps(d))
                ###print(stop)
                ###time.sleep(configurations.configurations['application']['loop_interval'])
                import configurations
                self.deep_sleep((configurations.configurations['application']['loop_interval'])*1000)                
            except OSError as e:
                print(e)
                AmotEngine.restartAndReconnect()
    
    def reload_components(self):
        del sys.modules['adl']
        del sys.modules['configurations']
        
        new_adl = __import__('adl')
        new_configurations = __import__('configurations')
        
        sys.modules['adl'] = new_adl
        sys.modules['configurations'] = new_configurations
        
        self.components = new_adl.adl['components']
        self.attachments = new_adl.adl['attachments']
        self.adaptability = new_adl.adl['adaptability']
        for module in [module for module in sys.modules.keys() if module[:11] == 'components.']:
            del sys.modules[module]

        for component in self.components:
            component_file = self.components.get(component)
            namespace = __import__('components.' + component_file)
            component_module = getattr(namespace, component_file)
            component_instance = getattr(component_module, component)
            self.current_components[component] = component_instance()
            
        ## set new configuration in the application
        import configurations
        app_module = __import__('app')
        setattr(app_module, 'configurations', new_configurations)
        app_instance = getattr(app_module, 'App')
        self.app = app_instance()







