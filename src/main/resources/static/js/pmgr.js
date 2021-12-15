"use strict"

import * as Pmgr from './pmgrapi.js'

/**
 * Librería de cliente para interaccionar con el servidor de PeliManager (pmgr).
 * Prácticas de IU 2021-22
 *
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas.
 *
 * Recomiendo separar el fichero en 2 partes:
 * - parte "página-independiente": funciones que pueden generar cachos de
 *   contenido a partir del modelo, pero que no tienen referencias directas a la página
 * - parte pequeña, al final, de "pegamento": asocia comportamientos a
 *   elementos de la página.
 * Esto tiene la ventaja de que, si cambias tu página, sólo deberías tener
 * que cambiar el pegamento.
 *
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él:
 * lo que quieras siempre y cuando
 * - no digas que eres el autor original.
 * - no me eches la culpa de haberlo escrito mal.
 *
 * @Author manuel.freire@fdi.ucm.es
 */

//
// PARTE 1:
// Código de comportamiento, que sólo se llama desde consola (para probarlo) o desde la parte 2,
// en respuesta a algún evento.
//

/**
 * 
 * @param {string} sel CSS usado para indicar qué fieldset quieres convertir
 * en estrellitas. Se espera que el fieldset tenga este aspecto:
 *      <label title="Atómico - 5 estrellas">
            <input type="radio" name="rating" value="5" />
        </label>

        <label title="Muy buena - 4 estrellas">
            <input type="radio" name="rating" value="4" />
        </label>

        <label title="Pasable - 3 estrellas">
            <input type="radio" name="rating" value="3" />
        </label>

        <label title="Más bien mala - 2 estrellas">
            <input type="radio" name="rating" value="2" />
        </label>

        <label title="Horrible - 1 estrella">
            <input type="radio" name="rating" value="1" />
        </label>
 */
function stars(sel) {
    const changeClassOnEvents = (ss, s) => {
        s.addEventListener("change", e => {
            // find current index
            const idx = e.target.value;
            // set selected for previous & self, remove for next
            ss.querySelectorAll("label").forEach(label => {
                if (label.children[0].value <= idx) {
                    label.classList.add("selected");
                } else {
                    label.classList.remove("selected");
                }
            });
        });
    };
    const activateStars = (ss) => {
        ss.classList.add("rating");
        ss.querySelectorAll("input").forEach(s =>
            changeClassOnEvents(ss, s));
        let parent = ss;
        while (!parent.matches("form")) {
            parent = parent.parentNode;
        }
        parent.addEventListener("reset", () => {
            ss.querySelectorAll("input").forEach(e => e.checked = false);
            ss.querySelectorAll("label").forEach(e => e.classList.remove("selected"));
        });
    }
    document.querySelectorAll(sel).forEach(activateStars);
}

function createMovieItem(movie) {
    const r2s = r => r > 0 ? Pmgr.Util.fill(r, () => "⭐").join("") : "";
    const ratings = movie.ratings.map(id => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${r.user==userId?"primary":"secondary"}">
        ${Pmgr.resolve(r.user).username}: ${r.labels} ${r2s(r.rating)}
        </span>
        `
    ).join("");

    return `
    <div class"col">
    <div style="height: 300px;" class="card" data-id="${movie.id}">
    <div style="height: 70px; background-color: rgb(63, 63, 70); color: white;" class="card-header"">
        <h4 class="mb-0" title="${movie.id}">
            ${movie.name} <small><i>(${movie.year})</i></small>
        </h4>
    </div>

    <div>
        <div class="card-body pcard">
            <div class="row">
                <div class="col-auto">
                    <img class="iuthumb" src="${serverUrl}poster/${movie.imdb}"/>
                </div>
                <div class="col">
                    <div class="row-12">
                        ${movie.director} / ${movie.actors} (${movie.minutes} min.)
                    </div>        
                    <div class="row-12">
                        ${ratings}
                    </div>        
                    <div class="iucontrol movie">
                        <button class="rm" data-id="${movie.id}">🗑️</button>
                        <button class="edit" data-id="${movie.id}">✏️</button>
                        <button class="rate" data-id="${movie.id}">⭐</button>
                    </div>  
                </div>
            </div>
        </div>
    </div>
    </div>
 `;
}

function createGroupItem(group) {
    let allMembers = group.members.map((id) =>
        `<span class="badge bg-secondary">${Pmgr.resolve(id).username}</span>`
    ).join(" ");
    const waitingForGroup = r => r.status.toLowerCase() == Pmgr.RequestStatus.AWAITING_GROUP;
    let allPending = group.requests.map((id) => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${waitingForGroup(r) ? "warning" : "info"}"
            title="Esperando aceptación de ${waitingForGroup(r) ? "grupo" : "usuario"}">
            ${Pmgr.resolve(r.user).username}<button style="border:0px; background-color:transparent;" class="editRequest" data-id="${r.id}">✏️</button></span>
            `
//metido arriba un boton por cada request, el cual guarda ademas en dat-id la id de la request
    ).join(" ");

    return `
    <div class="col">
    <div style="height: 200px;" class="card">
        <div style="height: 70px; background-color: rgb(63, 63, 70); color: white;" class="card-header">
            <h4 class="mb-0" title="${group.id}">
                <b class="pcard">${group.name}</b>
            </h4>
        </div>
        <div class="card-body pcard">
            <div class="row-sm-11" id="infoGroup">
                <span class="badge bg-primary">${Pmgr.resolve(group.owner).username}</span>
                ${allMembers}
                ${allPending}
            </div>
            <div class="row-sm-1 iucontrol group">
                <button class="rm" data-id="${group.id}">🗑️</button>
                <!--<button class="edit" data-id="${group.id}">✏️</button>-->
                <button class="addRequest" data-id="${group.id}">📩</button>
            </div>
         </div>              
    </div>
    </div>
`;
}

function createUserItem(user) {
    let allGroups = user.groups.map((id) =>
        `<span class="badge bg-secondary">${Pmgr.resolve(id).name}</span>`
    ).join(" ");
    const waitingForGroup = r => r.status.toLowerCase() == Pmgr.RequestStatus.AWAITING_GROUP;
    let allPending = user.requests.map((id) => Pmgr.resolve(id)).map(r =>
        `<span class="badge bg-${waitingForGroup(r) ? "warning" : "info"}"
            title="Esperando aceptación de ${waitingForGroup(r) ? "grupo" : "usuario"}">
            ${Pmgr.resolve(r.group).name}</span>`
    ).join(" ");

    return `
    <div class="col">
    <div style="height: 200px;" class="card">
    <div style="height: 70px; background-color: rgb(63, 63, 70); color: white;" class="card-header">
        <h4 class="mb-0" title="${user.id}">
            <b class="pcard">${user.username}</b>
        </h4>
    </div>
    <div class="card-body pcard">
        <div class="row-sm-11">
            ${allGroups}
            ${allPending}
        <div>
        <div class="row-sm-1 iucontrol user">
            <button class="rm" data-id="${user.id}">🗑️</button>
            <button class="edit" data-id="${user.id}">✏️</button>
        </div>        
    </div>
    </div>
    </div>
`;
}

/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
function nuevaPelicula(formulario) {
    const movie = new Pmgr.Movie(-1,
        formulario.querySelector('input[name="imdb"]').value,
        formulario.querySelector('input[name="name"]').value,
        formulario.querySelector('input[name="director"]').value,
        formulario.querySelector('input[name="actors"]').value,
        formulario.querySelector('input[name="year"]').value,
        formulario.querySelector('input[name="minutes"]').value);
    Pmgr.addMovie(movie).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        update();
    });
}

//CREATED
/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
 function nuevoGrupo(formulario) {
    const group = new Pmgr.Group(-1,
        formulario.querySelector('input[name="name"]').value,
        formulario.querySelector('input[name="propietario"]').value);
    Pmgr.addGroup(group).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        update();
    });
}

/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
 function nuevoUsuario(formulario) {
    const usuario = new Pmgr.User(-1,
        formulario.querySelector('input[name="name"]').value);
    Pmgr.addUser(usuario).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        update();
    });
}
//END CREATED
/**
 * Usa valores de un formulario para modificar una película
 * @param {Element} formulario para con los valores a subir
 */
function modificaPelicula(formulario) {
    const movie = new Pmgr.Movie(
        formulario.querySelector('input[name="id"]').value,
        formulario.querySelector('input[name="imdb"]').value,
        formulario.querySelector('input[name="name"]').value,
        formulario.querySelector('input[name="director"]').value,
        formulario.querySelector('input[name="actors"]').value,
        formulario.querySelector('input[name="year"]').value,
        formulario.querySelector('input[name="minutes"]').value)
    Pmgr.setMovie(movie).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalEditMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para añadir un rating
 * @param {Element} formulario para con los valores a subir
 */
function nuevoRating(formulario) {
    const rating = new Pmgr.Rating(-1,
        formulario.querySelector('input[name="user"]').value,
        formulario.querySelector('input[name="movie"]').value,
        formulario.querySelector('input[name="rating"]:checked').value,
        formulario.querySelector('input[name="labels"]').value);
    Pmgr.addRating(rating).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalRateMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para modificar un rating
 * @param {Element} formulario para con los valores a subir
 */
function modificaRating(formulario) {
    const rating = new Pmgr.Rating(
        formulario.querySelector('input[name="id"]').value,
        formulario.querySelector('input[name="user"]').value,
        formulario.querySelector('input[name="movie"]').value,
        formulario.querySelector('input[name="rating"]:checked').value,
        formulario.querySelector('input[name="labels"]').value);
    Pmgr.setRating(rating).then(() => {
        formulario.reset() // limpia el formulario si todo OK
        modalRateMovie.hide(); // oculta el formulario
        update();
    }).catch(e => console.log(e));
}

/**
 * Usa valores de un formulario para añadir una película
 * @param {Element} formulario para con los valores a subir
 */
function generaPelicula(formulario) {
    const movie = Pmgr.Util.randomMovie();
    for (let [k, v] of Object.entries(movie)) {
        const input = formulario.querySelector(`input[name="${k}"]`);
        if (input) input.value = v;
    }
}

/**
 * En un div que contenga un campo de texto de búsqueda
 * y un select, rellena el select con el resultado de la
 * funcion actualizaElementos (que debe generar options), y hace que
 * cualquier búsqueda filtre los options visibles.
 */
let oldHandler = false;
/**
 * Comportamiento de filtrado dinámico para un select-con-busqueda.
 * 
 * Cada vez que se modifica la búsqueda, se refresca el select para mostrar sólo 
 * aquellos elementos que contienen lo que está escrito en la búsqueda
 * 
 * @param {string} div selector que devuelve el div sobre el que operar
 * @param {Function} actualiza el contenido del select correspondiente
 */
function activaBusquedaDropdown(div, actualiza) {
    let search = document.querySelector(`${div} input[type=search]`);
    let select = document.querySelector(`${div} select`);

    // vacia el select, lo llena con elementos validos
    actualiza(`${div} select`);

    // manejador
    const handler = () => {
        let w = search.value.trim().toLowerCase();
        let items = document.querySelectorAll(`${div} select>option`);

        // filtrado; poner o.style.display = '' muestra, = 'none' oculta
        items.forEach(o =>
            o.style.display = (o.innerText.toLowerCase().indexOf(w) > -1) ? '' : 'none');

        // muestra un array JS con los seleccionados
        console.log("Seleccionados:", select.value);
    };

    // filtrado dinámico
    if (oldHandler) {
        search.removeEventListener('input', handler);
    }
    oldHandler = search.addEventListener('input', handler);
}

//
// Función que refresca toda la interfaz. Debería llamarse tras cada operación
// por ejemplo, Pmgr.addGroup({"name": "nuevoGrupo"}).then(update); // <--
//
function update() {
    const appendTo = (sel, html) =>
        document.querySelector(sel).insertAdjacentHTML("beforeend", html);
    const empty = (sel) => {
        const destino = document.querySelector(sel);
        while (destino.firstChild) {
            destino.removeChild(destino.firstChild);
        }
    }
    try {
        // vaciamos los contenedores
        empty("#movies");
        empty("#groups");
        empty("#users");

        // y los volvemos a rellenar con su nuevo contenido
        Pmgr.state.movies.forEach(o => appendTo("#movies", createMovieItem(o)));
        Pmgr.state.groups.forEach(o => appendTo("#groups", createGroupItem(o)));
        Pmgr.state.users.forEach(o => appendTo("#users", createUserItem(o)));

        // y añadimos manejadores para los eventos de los elementos recién creados
        // botones de borrar películas
        document.querySelectorAll(".iucontrol.movie button.rm").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                confirmacionDelMovie(id);
                //Pmgr.rmMovie(id).then(update);
            }));
        // botones de editar películas
        document.querySelectorAll(".iucontrol.movie button.edit").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                const movie = Pmgr.resolve(id);
                const formulario = document.querySelector("#movieEditForm");
                for (let [k, v] of Object.entries(movie)) {
                    // rellenamos el formulario con los valores actuales
                    const input = formulario.querySelector(`input[name="${k}"]`);
                    if (input) input.value = v;
                }

                modalEditMovie.show(); // ya podemos mostrar el formulario
            }));

            //boton enviar solicitudes de grupo
        document.querySelectorAll(".iucontrol.group button.addRequest").forEach(b =>
                b.addEventListener('click', e => {
                    const groupId = e.target.dataset.id; // lee el valor del atributo data-id del boton
                    const group = Pmgr.resolve(groupId);//info de ese grupo
                    console.log("id grupo = " + groupId);

                    //const request = new Pmgr.Request(-1,userId,groupId, Pmgr.RequestStatus.AWAITING_GROUP);
                   // Pmgr.addRequest(request)//.then(() =>{
                    Pmgr.addRequest({id: -1, user: userId, group: groupId, status: Pmgr.RequestStatus.AWAITING_GROUP});
                   //     f.reset();
                   //     update();
                   // });
                    modalRequestAdded.show();

                   // modalEditMovie.show(); // ya podemos mostrar el formulario
                }));

                //boton editar request
                document.querySelectorAll("#infoGroup button.editRequest").forEach(b =>
                    b.addEventListener('click', e => {
                        
                        let actualUser = Pmgr.resolve(userId);
                        //const idGrupo = e.target.dataset.idGrupo; // lee el valor del atributo data-id del boton
                        //console.log("id grupo: " + idGrupo);
                        const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                        const requestData = Pmgr.resolve(id);
                        const groupInfo= Pmgr.resolve(requestData.group);
        
                        if(actualUser.role == "ADMIN,USER" || actualUser.id == groupInfo.owner)
                        {
                            //permisos
                            const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                           const requestData = Pmgr.resolve(id);
                           idRequestToModify = id;
                           console.log("boton editar request con id" + id + " pulsado");//id de la request correcta
                           modalModifyRequest.show();
                        }
                        else
                        {
                            //no permisos
                            console.log("no tienes permisos para dicha accion");
                            modalNoPermisos.show();
                        }
                        //else if()
                        
                    }));


// botones de editar usuarios
document.querySelectorAll(".iucontrol.user button.edit").forEach(b =>
    b.addEventListener('click', e => {

        const datosUsActual = Pmgr.resolve(userId);
        console.log(datosUsActual.role);

        
        const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
        console.log(id); //id es el del usuario que se ha pulsado el boton editar
        editButtonUserId = id;
        console.log(editButtonUserId);

      //  if(userId == id)//-----------solo permitimos que un usuario modifique sus propios datos y no los de los demas--------
     //   {                     //--No se puede hacer, ya que se necesita permisos admin para cabiar usuarios, por tanto cada uno no puede cambiar sus propios datos
            //console.log("modificando tu usario");
            const user = Pmgr.resolve(id);
        const formulario = document.querySelector("#userEditForm");
       // console.log(Object.entries(user).username); //asi no funciona
        console.log(user.username);
        console.log(user.password);//los usuarios que recibimos vienen sin ese campo. No se podra rellenar en el formulario-------------------------

      //const no permite hacer const variable; ya que son variables onctates y deben estar inicializadas a algo. En ese caso usar let
        let sobreescribir;


       sobreescribir = formulario.querySelector('input[name="name"]');
      sobreescribir.value = user.username;
   //  sobreescribir = formulario.querySelector('input[name="passw"]');
    //  sobreescribir.value = user.password;
        /*for (let [k, v] of Object.entries(user)) {
            // rellenamos el formulario con los valores actuales
            const input = formulario.querySelector(`input[name="${k}"]`);
            if (input) input.value = v;
        }*/

        modalEditUser.show(); // ya podemos mostrar el formulario
      //  }
     /*   else{
            console.log("modificando otro usuario. accion no permitida");
        }*/
        
    }));

        // botones de evaluar películas
        document.querySelectorAll(".iucontrol.movie button.rate").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                const formulario = document.querySelector("#movieRateForm");
                const prev = Pmgr.state.ratings.find(r => r.movie == id && r.user == userId);
                if (prev) {
                    // viejo: copia valores
                    formulario.querySelector("input[name=id]").value = prev.id;
                    const input = formulario.querySelector(`input[value="${prev.rating}"]`);
                    if (input) {
                        input.checked;
                    }
                    // lanza un envento para que se pinten las estrellitas correctas
                    // see https://stackoverflow.com/a/2856602/15472
                    if ("createEvent" in document) {
                        const evt = document.createEvent("HTMLEvents");
                        evt.initEvent("change", false, true);
                        input.dispatchEvent(evt);
                    } else {
                        input.fireEvent("onchange");
                    }
                    formulario.querySelector("input[name=labels]").value = prev.labels;
                } else {
                    // nuevo
                    formulario.reset();
                    formulario.querySelector("input[name=id]").value = -1;
                }
                formulario.querySelector("input[name=movie]").value = id;
                formulario.querySelector("input[name=user]").value = userId;
                modalRateMovie.show(); // ya podemos mostrar el formulario
            }));
        // botones de borrar grupos
        document.querySelectorAll(".iucontrol.group button.rm").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                confirmacionDelGroup(id);
                //b.addEventListener('click', e => Pmgr.rmGroup(e.target.dataset.id).then(update)));
            })
        );
            


        // botones de borrar usuarios
        document.querySelectorAll(".iucontrol.user button.rm").forEach(b => 
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                confirmacionDelUser(id);
                //Pmgr.rmUser(e.target.dataset.id).then(update);
            })
        );

        /*document.querySelectorAll(".iucontrol.movie button.rm").forEach(b =>
            b.addEventListener('click', e => {
                const id = e.target.dataset.id; // lee el valor del atributo data-id del boton
                confirmacionDelMovie(id);
                //Pmgr.rmMovie(id).then(update);
            }));*/


    } catch (e) {
        console.log('Error actualizando', e);
    }

    /* para que siempre muestre los últimos elementos disponibles */
    activaBusquedaDropdown('#dropdownBuscablePelis',
        (select) => {
            empty(select);
            Pmgr.state.movies.forEach(m =>
                appendTo(select, `<option value="${m.id}">${m.name}</option>`));
        }
    );


}

{
    //funcionalidad dle boton de login: hacer visible su modal (codigo del modal, al final de este js junto a los otros modales)
    //se deja como bloque de codigo independiente para que funcione aunque no se haya hecho aun login (por eso no esta en update)
    document.querySelector("#prueba button.log").addEventListener('click', e => {
        console.log("boton login pulsado");
       modalLogin.show();
    });
}

//
// PARTE 2:
// Código de pegamento, ejecutado sólo una vez que la interfaz esté cargada.
//

// modales, para poder abrirlos y cerrarlos desde código JS
const modalEditMovie = new bootstrap.Modal(document.querySelector('#movieEdit'));
const modalRateMovie = new bootstrap.Modal(document.querySelector('#movieRate'));

//nuevos modales
const modalEditUser = new bootstrap.Modal(document.querySelector('#userEdit')); //modal modificar usuario
const modalLogin = new bootstrap.Modal(document.querySelector('#modalLogin')); //modal para login
const modalRequestAdded = new bootstrap.Modal(document.querySelector('#modalRequestAdded')); //modal confirmacion request
const modalModifyRequest = new bootstrap.Modal(document.querySelector('#modalModifyRequest')); //modal editar request
const modalNoPermisos = new bootstrap.Modal(document.querySelector('#modalNoPermiso')); //modal no permisos


const modalDelMovie = new bootstrap.Modal(document.querySelector('#modalDelMovie')); // modal para eliminar o no pelicula
const modalDelUser = new bootstrap.Modal(document.querySelector('#modalDelUser')); // modal para eliminar o no usuario
const modalDelGroup = new bootstrap.Modal(document.querySelector('#modalDelGroup')); // modal para eliminar o no grupo

// si lanzas un servidor en local, usa http://localhost:8080/
const serverUrl = "http://gin.fdi.ucm.es/iu/";

Pmgr.connect(serverUrl + "api/");


let editButtonUserId; //----variable que guarda el id del usuario a modificar (del que se pulso el boton edit)------------------------------

// guarda el ID que usaste para hacer login en userId
let userId = -1;
const login = (username, password) => {
    Pmgr.login(username, password) // <-- tu nombre de usuario y password aquí
        .then(d => {
            console.log("login ok!", d);
  //          update(d);
            userId = Pmgr.state.users.find(u =>
                u.username == username).id;
                //finalmente creamos e insertamos el navbar en funcion del rol del usuario
                cretaeCustomNavbar();
                update(d); //hacemos update despues de saber la id del usuario actual, para poder mostrar un navbar u otro en funcion de su rol
                console.log(userId);
        })
        .catch(e => {
            console.log(e, `error ${e.status} en login (revisa la URL: ${e.url}, y verifica que está vivo)`);
            console.log(`el servidor dice: "${e.text}"`);
        });
}

                 // -- IMPORTANTE --
login("g5", "8rACc"); // <-- tu nombre de usuario y password aquí
                 //   y puedes re-logearte como alguien distinto desde  la consola
                 //   llamando a login() con otro usuario y contraseña
{
    /** 
     * Asocia comportamientos al formulario de añadir películas 
     * en un bloque separado para que las constantes y variables no salgan de aquí, 
     * manteniendo limpio el espacio de nombres del fichero
     */
    const f = document.querySelector("#addMovie form");
    // botón de enviar
    f.querySelector("button[type='submit']").addEventListener('click', (e) => {
        if (f.checkValidity()) {
            e.preventDefault(); // evita que se haga lo normal cuando no hay errores
            nuevaPelicula(f); // añade la pelicula según los campos previamente validados
        }
    });
    // botón de generar datos (sólo para pruebas)
    f.querySelector("button.generar").addEventListener('click',
        (e) => generaPelicula(f)); // aquí no hace falta hacer nada raro con el evento
} {
    /**
     * formulario para modificar películas
     */
    const f = document.querySelector("#movieEditForm");
    // botón de enviar
    document.querySelector("#movieEdit button.edit").addEventListener('click', e => {
        console.log("enviando formulario!");
        if (f.checkValidity()) {
            modificaPelicula(f); // modifica la pelicula según los campos previamente validados
        } else {
            e.preventDefault();
            f.querySelector("button[type=submit]").click(); // fuerza validacion local
        }
    });
} {
    /**
     * formulario para evaluar películas; usa el mismo modal para añadir y para editar
     */
    const f = document.querySelector("#movieRateForm");
    // botón de enviar
    document.querySelector("#movieRate button.edit").addEventListener('click', e => {
        console.log("enviando formulario!");
        if (f.checkValidity()) {
            if (f.querySelector("input[name=id]").value == -1) {
                nuevoRating(f);
            } else {
                modificaRating(f); // modifica la evaluación según los campos previamente validados
            }
        } else {
            e.preventDefault();
            f.querySelector("button[type=submit]").click(); // fuerza validacion local
        }
    });
    // activa rating con estrellitas
    stars("#movieRateForm .estrellitas");
}


//nuevo usuario
{

    const f = document.querySelector("#addUserForm");
    
    document.querySelector("#addUser button.add").addEventListener('click', e => {
        console.log("usuario enviado");
        if(f.checkValidity()){
            //console.log("correcto");
          /*const us = new Pmgr.User(-1,  //esto funciona
                "cleo",
                "c");/*
        /*Pmgr.addUser(us).then(() => {   //esto tambien
                   update();
               });*/
           /* Pmgr.addUser({username:"sergi", password:"s"}).then(() => {  //esto tambien
                   update();
               });*/
           
               const us = new Pmgr.User(-1,
               f.querySelector('input[name="name"]').value,
               f.querySelector('input[name="passw"]').value);
               Pmgr.addUser(us).then(() => {   
                   f.reset();
                    update();
            });
        }
        else{
            e.preventDefault();
            f.querySelector("button[type=submit]").click();
            console.log("fallo");
        }
    
        //    Pmgr.addUser(us).then(() => {
          //      //formulario.reset() // limpia el formulario si todo OK
            //    update();
           // });
    
      //  }
    });
    
}



{
    /**
     * formulario para modificar usuarios
     */
    const f = document.querySelector("#userEditForm");
    // botón de enviar
    document.querySelector("#userEdit button.edit").addEventListener('click', e => {
        console.log("enviando formulario!");
        if (f.checkValidity()) {
            console.log(editButtonUserId); //funciona bien. Es el id del usuario del que s epulso el boton editar sus datos
           // modificaPelicula(f); // modifica la pelicula según los campos previamente validados

          /* const us = new Pmgr.User(-1,
            f.querySelector('input[name="name"]').value,
            f.querySelector('input[name="passw"]').value);
            Pmgr.addUser(us).then(() => {   
                f.reset();
                 update();
         });*/

         const us = new Pmgr.User(editButtonUserId,
            f.querySelector('input[name="name"]').value,
            f.querySelector('input[name="passw"]').value);
            Pmgr.setUser(us).then(() => {   
                f.reset();
                 update();
                 modalEditUser.hide();

            });
         
        } else {
            e.preventDefault();
            f.querySelector("button[type=submit]").click(); // fuerza validacion local
        }
        //f.reset();
        //update();

    });
}

//nuevo grupo
{

    const f = document.querySelector("#addGroupForm");
    
    document.querySelector("#addGroup button.add").addEventListener('click', e => {
        console.log("grupo enviado");
        if(f.checkValidity()){
            //console.log("correcto");
          /*const us = new Pmgr.User(-1,  //esto funciona
                "cleo",
                "c");/*
        /*Pmgr.addUser(us).then(() => {   //esto tambien
                   update();
               });*/
           /* Pmgr.addUser({username:"sergi", password:"s"}).then(() => {  //esto tambien
                   update();
               });*/
          
//             let  uid = Pmgr.state.users.find(u =>
//                u.username ==  "Rebe").id; //coge bien su id 6071

 //               let  uid = Pmgr.state.users.find(u =>
//                  u.username ==  f.querySelector('input[name="owner"]').value).id; //funciona
            let  uid = Pmgr.state.users.find(u =>
                    u.username ==  f.querySelector('input[name="owner"]').value).id;

                   // Pmgr.addGroup({name:"los rebe", owner:6071});

                Pmgr.addGroup({name: f.querySelector('input[name="name"]').value, owner:uid}).then(() =>{
                    f.reset();
                    update();
                });


//f.querySelector('input[name="name"]').value
             //  userId = Pmgr.state.users.find(u =>
               //     u.username == username).id;
               console.log(uid);
//Pmgr.addUser({username:"raul", password:"r"});
          /*    const gr = new Pmgr.Group(
                f.querySelector('input[name="name"]').value,
                    f.querySelector('input[name="owner"]').value);
               Pmgr.addGroup(gr).then(() => {   
                   f.reset();
                    update();
            });*/
            
        }
        else{
            e.preventDefault();
            f.querySelector("button[type=submit]").click();
            console.log("fallo");
        }
    
        //    Pmgr.addUser(us).then(() => {
          //      //formulario.reset() // limpia el formulario si todo OK
            //    update();
           // });
    
      //  }
    });
    
}

//login
{

    const f = document.querySelector("#loginForm");
    
    document.querySelector("#modalLogin button.login").addEventListener('click', e => {
        console.log("boton aceptar login pulsado");
       if(f.checkValidity()){
        login(f.querySelector('input[name="name"]').value, f.querySelector('input[name="passw"]').value)//.then(() => {   
            
            f.reset();
            modalLogin.hide();
             update();
        
           //  });;           
           /*    const us = new Pmgr.User(-1,
               f.querySelector('input[name="name"]').value,
               f.querySelector('input[name="passw"]').value);
               Pmgr.addUser(us).then(() => {   
                   f.reset();
                    update();
            });*/
        }
        else{
            e.preventDefault();
            f.querySelector("button[type=submit]").click();
            console.log("fallo");
        }
    
        //    Pmgr.addUser(us).then(() => {
          //      //formulario.reset() // limpia el formulario si todo OK
            //    update();
           // });
    
      //  }
    });
    
}

//las dos funcionan
/*function miPruebaInserccion(append)
{

    append("#prueba", createHTML());

}
function createHTML()
{
return`
<h5 class="modal-title" id="pruebatitulo">Mi prueba</h5>
`;
}*/

//boton aceptar modal confirmacion envio requets a grupo
{   
     document.querySelector("#modalRequestAdded button.accept").addEventListener('click', e => {
         //console.log("boton aceptar login pulsado");
        
             modalRequestAdded.hide();
              update();
     });   
}

//boton aceptar modal no permisos
{
    document.querySelector("#modalNoPermiso button.accept").addEventListener('click', e => {
         modalNoPermisos.hide();
             update();
    }); 
}

let idRequestToModify = -1;
//modal aceptar/rechazar request
{
    //boton aceptar solicitud
     document.querySelector("#modalModifyRequest button.aceptar").addEventListener('click', e => {
         console.log("id request desde el modal "+ idRequestToModify); //hasta aqui bien
        
        const requestData = Pmgr.resolve(idRequestToModify);
      //  Pmgr.setRequest({id:idRequestToModify, status: Pmgr.RequestStatus.ACCEPTED});
        //const request = new Pmgr.Request({id: id, user: requestData.user, group: requestData.group, status: Pmgr.RequestStatus.ACCEPTED}); //no coge bien el id no se porque
        const request = new Pmgr.Request(idRequestToModify, requestData.user, requestData.group, Pmgr.RequestStatus.ACCEPTED);
        Pmgr.setRequest(request).then(() => {
            modalModifyRequest.hide(); // oculta el formulario
            update();
        }).catch(e => console.log(e));

    });

        //boton rechazar solicitud
        document.querySelector("#modalModifyRequest button.rechazar").addEventListener('click', e => {
            console.log("id request desde el modal "+ idRequestToModify); //hasta aqui bien
           
           const requestData = Pmgr.resolve(idRequestToModify);
         //  Pmgr.setRequest({id:idRequestToModify, status: Pmgr.RequestStatus.ACCEPTED});
           //const request = new Pmgr.Request({id: id, user: requestData.user, group: requestData.group, status: Pmgr.RequestStatus.ACCEPTED}); //no coge bien el id no se porque
           const request = new Pmgr.Request(idRequestToModify, requestData.user, requestData.group, Pmgr.RequestStatus.REJECTED);
           Pmgr.setRequest(request).then(() => {
               modalModifyRequest.hide(); // oculta el formulario
               update();
           }).catch(e => console.log(e));

        });
           
 }


function cretaeCustomNavbar()
{

    const append = (sel, html) =>
    document.querySelector(sel).insertAdjacentHTML("beforeend", html);
    const emp = (sel) => {
        const destino = document.querySelector(sel);
        while (destino.firstChild) {
            destino.removeChild(destino.firstChild);
        }
    }
    const datosUsActual = Pmgr.resolve(userId);//obtenemos datos del usuario actual
    console.log(datosUsActual.role);

    //emp("#customNavbar");//vaciamos el contendor donde va el navbar
    
    emp("#navbarSupportedContent");
    if(datosUsActual.role == "ADMIN,USER")//metemos un codigo html u otro en funcion del rol del usuario
    {
    // append("#customNavbar", customNavbarAdminHTML());
    append("#navbarSupportedContent", customNavbarAdminHTML());
    }
    else{
       // append("#customNavbar", customNavbarUserHTML());
       append("#navbarSupportedContent", customNavbarUserHTML());
    }
    creteloggingfunction();
    //hacemos que se pulse el boton peliculas del navbar para que siempre que s ehaga login se vea esa vista.
    //esto evita que si un usuario admin estaba en la vista de usuarios, y se logea entonces un usuario user,
    //este pueda ver la vista de usuarios, forzandole asi a ir a la vista de peliculas
    document.querySelector("#peliculas-tab").click();
    //quizas seria necesario hacer un update tras el click, pero como se llama a esta funcion desde login, es seguro que despues se llamara a update
}

function customNavbarAdminHTML()
{
    return`
    <!-- navbar nuestro -->
    <!-- ver https://getbootstrap.com/docs/5.0/components/navs-tabs/#javascript-behavior -->
    <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="peliculas-tab" data-bs-toggle="tab" data-bs-target="#peliculasTab" type="button" role="tab" aria-controls="home" aria-selected="true">Peliculas</button>
        </li>

        <li class="nav-item" role="presentation">
            <button class="nav-link" id="grupos-tab" data-bs-toggle="tab" data-bs-target="#gruposTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Grupos</button>
        </li>

        <li class="nav-item" role="presentation">
            <button class="nav-link" id="usuarios-tab" data-bs-toggle="tab" data-bs-target="#usuariosTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Usuarios</button>
        </li>
    </ul>

    
    `;
}

function customNavbarAdminHTML2()
{
    return`
    <ul class="nav mr-auto" id="myTab" role="tablist">
        
    <li class="nav-item" role="presentation">
        <a id="peliculas-tab" data-bs-toggle="tab" data-bs-target="#peliculasTab" role="tab" aria-controls="home" aria-selected="true">Peliculas</a>
    </li>

    <li class="nav-item" role="presentation">
        <a  id="grupos-tab" data-bs-toggle="tab" data-bs-target="#gruposTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Grupos</button>
    </li>
    <li class="nav-item" role="presentation">
        <a id="usuarios-tab" data-bs-toggle="tab" data-bs-target="#usuariosTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Usuarios</button>
    </li>

    <!-- contenedor de prueba para poner temporalmente el boton de login-->
    
</ul>
    `;
}

function customNavbarUserHTML()
{
    return`
    <!-- navbar nuestro -->
    <!-- ver https://getbootstrap.com/docs/5.0/components/navs-tabs/#javascript-behavior -->
    <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="peliculas-tab" data-bs-toggle="tab" data-bs-target="#peliculasTab" type="button" role="tab" aria-controls="home" aria-selected="true">Peliculas</button>
        </li>

        <li class="nav-item" role="presentation">
            <button class="nav-link" id="grupos-tab" data-bs-toggle="tab" data-bs-target="#gruposTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Grupos</button>
        </li>

    </ul>


    `;
}

function customNavbarUserHTML2()
{
    return`
    <ul class="nav mr-auto" id="myTab" role="tablist">
        
                <li class="nav-item" role="presentation">
                    <a id="peliculas-tab" data-bs-toggle="tab" data-bs-target="#peliculasTab" role="tab" aria-controls="home" aria-selected="true">Peliculas</a>
                </li>
        
                <li class="nav-item" role="presentation">
                    <a  id="grupos-tab" data-bs-toggle="tab" data-bs-target="#gruposTab" type="button" role="tab" aria-controls="profile" aria-selected="false">Grupos</button>
                </li>
            
                <!-- contenedor de prueba para poner temporalmente el boton de login-->
            </ul>
    `;
}

function creteloggingfunction()
{
    //funcionalidad dle boton de login: hacer visible su modal (codigo del modal, al final de este js junto a los otros modales)
    //se deja como bloque de codigo independiente para que funcione aunque no se haya hecho aun login (por eso no esta en update)
    document.querySelector("#prueba button.log").addEventListener('click', e => {
        console.log("boton login pulsado");
       modalLogin.show();
    });
}

function confirmacionDelMovie(id)
{
    modalDelMovie.show();
    document.querySelector("#modalDelMovie button.accept").addEventListener('click', e => {
        //console.log("boton aceptar login pulsado");       
            modalDelMovie.hide();
            Pmgr.rmMovie(id).then(update);       
    });
}


function confirmacionDelUser(id)
{
    modalDelUser.show();
    document.querySelector("#modalDelUser button.accept").addEventListener('click', e => {
        //console.log("boton aceptar login pulsado");    
            modalDelUser.hide();
            Pmgr.rmUser(id).then(update);   
    });
}

function confirmacionDelGroup(id)
{
    modalDelGroup.show();
    document.querySelector("#modalDelGroup button.accept").addEventListener('click', e => {
        //console.log("boton aceptar login pulsado");
       
            modalDelGroup.hide();
            Pmgr.rmGroup(id).then(update);
        
    });

}


/**
 * búsqueda básica de películas, por título
 */
document.querySelector("#movieSearch").addEventListener("input", e => {
    const v = e.target.value.toLowerCase();
    document.querySelectorAll("#movies div.card").forEach(c => {
        const m = Pmgr.resolve(c.dataset.id);
        // aquí podrías aplicar muchos más criterios
        const ok = m.name.toLowerCase().indexOf(v) >= 0;
        c.style.display = ok ? '' : 'none';
    });
})

// cosas que exponemos para poder usarlas desde la consola
window.modalEditMovie = modalEditMovie;
window.modalRateMovie = modalRateMovie;
window.update = update;
window.login = login;
window.userId = userId;
window.Pmgr = Pmgr;

// ejecuta Pmgr.populate() en una consola para generar datos de prueba en servidor
// ojo - hace *muchas* llamadas a la API (mira su cabecera para más detalles)
// Pmgr.populate();
