import os
import socket
import time
import gc

class AmotAgent:
    
    app_context = {}
    env_context = {}
    _env = {}

    @staticmethod
    def send_receive(socket, data):
        buffer_size = 536
        fragments = []
        response = b''
        try:
            socket.sendall(data)
            while True:
                part = socket.recv(buffer_size)
                if not part:
                    break
                fragments.append(part) # fix - https://stackoverflow.com/questions/17667903/python-socket-receive-large-amount-of-data
            response = response.join(fragments)
            gc.collect()
            if response == b'0':
                return None
            elif response == b'':
                # TODO look for a better exception
                raise OSError
            return response
        except OSError as e:
            print('Cant send or receive data')
            socket.close()
            return False

    @staticmethod
    def update_files(data, clear = True): # data should be a string
        if clear:
            # clear directory
            files = os.listdir('components')
            for file in files:
                path = 'components/' + file
                try:
                    f = open(path, "r")
                    f.close()
                    os.remove(path)
                except OSError:
                   pass

        # writing files from data
        files = data.split('\x1c') # FILE SEPARATOR (28)
        for comp_content in files:
            compname, content = comp_content.split('\x1d') # GROUP SEPARATOR (29)
            file = compname + '.py'
            wr = open(file, 'w')
            wr.write(content)
            wr.close()
        gc.collect()
            

    @staticmethod
    def adapt():
        print('Adapting...')

        AmotAgent.env_context['battery'] = b'100'
        AmotAgent.app_context['temperature'] = b'30'              

        try:
            conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            conn.connect(socket.getaddrinfo(AmotAgent._env['AMOT_HOST'], AmotAgent._env['AMOT_PORT'])[0][-1])
        except:
            print('Could not create socket for adaptation')
            return False

        msg = b'ADAPT\nThing:' + bytes(AmotAgent._env['THING_ID'], 'ascii')
        for info in AmotAgent.app_context:
            msg += b'\n' + bytes(info, 'ascii') + b':' + AmotAgent.app_context[info]
        for info in AmotAgent.env_context:
            msg += b'\n' + bytes(info, 'ascii') + b':' + AmotAgent.env_context[info]
        print(msg)
        data = AmotAgent.send_receive(conn, msg)
        gc.collect()
        data = str(data, 'ascii')
        print(data)
        if data == None:
            return

        # headers => "instructions" from server
        # data => files with their names
        [headers, data] = data.split('\x1e')
        headers = [h for h in headers.split('\n')]
        for h in headers:
            print(h)
            if h[:3] == 'rm:':
                # remove a file
                file_to_remove = h[3:]
                try:
                    os.remove(file_to_remove)
                except Exception as e:
                    pass

        if len(data) > 0:
            AmotAgent.update_files(data, False)
            print('Adapted')
            return True

        return False

    @staticmethod
    def thingStart():
        print('Running the amot agent...')
        # connecting to server
        conn = None
        for i in range(5):
            try:
                conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                conn.connect(socket.getaddrinfo(AmotAgent._env['AMOT_HOST'], AmotAgent._env['AMOT_PORT'])[0][-1])
                break
            except:
                conn = None
                time.sleep(1)
                print('Faleid to connect to the AMoT Server')

        if conn is None:
            return

        # sending data
        # msg = b'START\nThing:soueu\nComponents:' + b','.join([bytes(c, 'ascii') for c in components])
        msg = b'START_NEW\nThing:' + bytes(AmotAgent._env['THING_ID'], 'ascii')
        data = AmotAgent.send_receive(conn, msg)
        gc.collect()
        data = str(data, 'ascii')
        
        try:
            [headers, data] = data.split('\x1e')
        except:
            pass
        AmotAgent.update_files(data)

