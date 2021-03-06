/******************************************************************
 ELEMENTOS DEL DOM.
 ******************************************************************/
const conectar = document.getElementById('conectar');
const desconectar = document.getElementById('desconectar');

const iniciar = document.getElementById('iniciar');
const parar = document.getElementById('parar');

const terminal = document.querySelector('.mensajes');

/******************************************************************
 REALIZAR LA CONEXIÓN ENTRE EL BLUETOOTH Y EL NAVEGADOR.
 ******************************************************************/

conectar.addEventListener('click', () => {
    
    requerirDispositivosBT()
        .then(device => conectarConDispositivoBT(device))
        .then(gattserver => conectarConElServicio(gattserver))
        .then(service => obtenerCaracteristicasDelServicio(service))
        .then(characteristics => conectarConCaracteristica(characteristics))
        .then(characteristic => conectarseACambiosDelSensor(characteristic))
        .catch(err => terminal.innerText = "Fallo la conexión")
});

desconectar.addEventListener('click', () => {
    if(!!caracteristica) {
        dispositivo.gatt.disconnect();
        terminal.innerText = "Desconectado";
    } else {
        terminal.innerText = 'Ningún dispositivo conectado';
    }

});

/**************************************************************************
 FUNCIONES PARA CONTROLAR LA CONEXIÓN ENTRE EL BLUETOOTH Y EL NAVEGADOR.
 *************************************************************************/

const servicio = 0xFFE0;
let caracteristica = null;
let dispositivo = '';

const separador = '\n';
let dataBuffer = '';

const requerirDispositivosBT = () => {
    /* Desplegar lista de dispositivos BT disponibles y realizar 
    selección de dispositivo para conectar, retorna una promesa 
    con el objeto del dispositivo SELECCIONADO. */ 

    terminal.innerText = "Buscando dispositivos...";

    /* Revisar si navigator.bluetooth está disponible */

    if(navigator.bluetooth !== undefined){
        return (
            navigator.bluetooth.requestDevice({
                // filters: [myFilters]       // filtros o acceptAllDevices
                optionalServices: [servicio],
                acceptAllDevices: true
            })          
        );
    } else {
        alert('Conexión bluetooth no disponible en este dispositivo o navegador.');
        return Promise.reject();
    }
};

const conectarConDispositivoBT = (device) => {
    /* Realizar la conexión con el dispositivo BT seleccionado y 
    guardar el dispositivo conectado como un objeto para procesar la
    desconexión entre el navegador y el BT, retorna una promesa con el 
    objeto del dispositivo CONECTADO. */
    
    terminal.innerText = "Conectando con dispositivo...";

    dispositivo = device;
    return device.gatt.connect();
};

const conectarConElServicio = (gattserver) => {
    /* Conectarse al servicio del dispositivo BT a través del servidor 
    gatt para poder enviar y recibir datos, returna una promesa con el
    objeto con la información del servicio al que se conecto el navegador. */

    terminal.innerText = "Conectando con el servicio...";
    
    return gattserver.getPrimaryService(servicio);
};

const obtenerCaracteristicasDelServicio = (service) => {
    /* Obtener la lista de características disponibles en el servicio del 
    dispositivo BT, retorna una promesa con un arreglo que contiene todas
    las características del servicio, en el caso del módulo HM-10 solo hay
    una caracteríastica disponible. */

    terminal.innerText = "Obteniendo características...";

    return service.getCharacteristics();
};

const conectarConCaracteristica = (characteristics) => {
    /* Iniciar las notificaciones en la característica disponible 
    en el servicio del dispositivo BT, retorna una promesa con un 
    objeto que contiene la información de la característica, está
    es la que se modificara para recibir y enviar datos a través 
    del módulo BT. */

    terminal.innerText = "Conectando a característica";

    caracteristica = characteristics[0];
    return caracteristica.startNotifications();
};

const conectarseACambiosDelSensor = (caracteristica) => {
    /* Conectar la característica del modulo BT a la función que procesa los datos que 
    envia el sensor a através del módulo BT */

    terminal.innerText = `Conectado ${dispositivo.name}`;

    caracteristica.oncharacteristicvaluechanged = manejarCambios;
};

/************************************************************************
 FUNCIONES PARA MANEJAR LOS DATOS QUE SE OBTIENEN DEL SENSOR.
 ***********************************************************************/
let datosSensor = [];

const recibirDatos = (data) => {
    datosSensor.push(data);
    terminal.innerText = datosSensor.length;
};

const manejarCambios = (event) => {
    const valor = new TextDecoder().decode(event.target.value);

    for (const c of valor) {
      if (c === separador) {
        const data = dataBuffer.trim();
        dataBuffer = '';

        if (data !== NaN) {
            recibirDatos(data);
        }

      } else {
        dataBuffer += c;
      }
    }
    
};

/**************************************************************************
 FUNCIONES PARA ENVIAR DATOS AL MICROCONTROLADOR DESDE EL NAVEGADOR.
 *************************************************************************/

// Enviar valores al módulo BLE:
const send = (caracteristica, data) => {
    /* Enviar caracteres al módulo BLE para que las pase al 
    microcontrolador que conecta con el sensor */

    caracteristica.writeValue(new TextEncoder().encode(data));
};

iniciar.addEventListener('click', () => {
    console.log('play', caracteristica);
    if(!!caracteristica) {
        send(caracteristica, 'i');
    } else {
        terminal.innerText = 'Ningún dispositivo conectado';
    }
    
});

parar.addEventListener('click', () => {
    console.log('stop', caracteristica);
    if(!!caracteristica) {
        send(caracteristica, 'p');
    }
    
    terminal.innerText = `${datosSensor.length} datos recibidos`;
});

