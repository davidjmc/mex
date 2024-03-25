adl = {
    'components': {
        'QueueProxy': 'QueueProxy2', 'Marshaller': 'NewMarshaller', 'ClientRequestHandler': 'NewClientRequestHandler'
    },
    'attachments': {
        'QueueProxy':'Marshaller','Marshaller':'ClientRequestHandler'
    },
    'adaptability': {
        'type': '',
        'timeout': 30
    },
    'configuration': {
        'start': 'QueueProxy',
        'otherConfigs': {}
    }
}