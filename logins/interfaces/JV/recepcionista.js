document.addEventListener("DOMContentLoaded", () => { // recepcionista.js
  const newAppointmentBtn = document.getElementById("newAppointmentBtn"); // Botón para nueva cita
  const appointmentModal = document.getElementById("appointmentModal"); // Modal de nueva cita
  const closeModal = document.getElementById("closeModal"); // Botón para cerrar modal
  const appointmentForm = document.getElementById("appointmentForm"); // Formulario de cita
  const appointmentTable = document.getElementById("appointmentTable"); // Tabla de citas
  const registerBtn = document.querySelector(".register-btn"); // Botón de registro rápido
  const registerForm = document.querySelector(".register-form"); // Formulario de registro rápido
  const totalCitasEl = document.querySelector(".stat-box.total span"); // Estadística de citas
  const confirmedCitasEl = document.querySelector(".stat-box.confirmed span"); // Estadística de citas confirmadas
  const pendingCitasEl = document.querySelector(".stat-box.pending span");// Estadística de citas pendientes
  const welcomeMessage = document.querySelector(".welcome-message");// Mensaje de bienvenida




// === Mostrar mensaje de bienvenida solo al iniciar sesión ===
 window.addEventListener("load", () => {
  const mostrar = sessionStorage.getItem("mostrarBienvenida");
  if (mostrar !== "true") return; // si ya se mostró, no hacer nada

  const rol = sessionStorage.getItem("rol") || "Usuario";
  const nombre = sessionStorage.getItem("nombre") || "";
  const hora = new Date().toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit' });

  const toast = document.createElement("div");
  toast.classList.add("toast-bienvenida");
  toast.textContent = `👋 ¡Bienvenida ${rol} ${nombre}! Inicio de sesión: ${hora}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.5s forwards";
    setTimeout(() => toast.remove(), 500);
  }, 4000);

  // Desactivar la bienvenida para no repetirla
  sessionStorage.removeItem("mostrarBienvenida");
});




  // Mostrar la fecha actual en formato español
  const dateElement = document.querySelector(".date");
  const hoy = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
  dateElement.textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  let citas = [];
  let pacientes = [];
  let bienvenidaMostrada = false;

  // ====== Mostrar / eliminar errores ======
  function mostrarError(input, mensaje) {
    eliminarError(input);
    const error = document.createElement("small");
    error.classList.add("error-msg");
    error.textContent = mensaje;
    input.insertAdjacentElement("afterend", error);
  }


  
// ====== Eliminar mensaje de error ======
  function eliminarError(input) {
    const siguiente = input.nextElementSibling;
    if (siguiente && siguiente.classList.contains("error-msg")) {
      siguiente.remove();
    }
  }

  // ====== Abrir y cerrar modal ======
  newAppointmentBtn.addEventListener("click", () => {
    appointmentModal.style.display = "flex";
    setTimeout(() => (appointmentModal.style.opacity = "1"), 10);
  });

  closeModal.addEventListener("click", closeAppointmentModal);
  appointmentModal.addEventListener("click", (e) => {
    if (e.target === appointmentModal) closeAppointmentModal();
  });

  function closeAppointmentModal() {
    appointmentModal.style.opacity = "0";
    setTimeout(() => (appointmentModal.style.display = "none"), 300);
  }

  // ====== Validar nombre ======
  function validarNombre(input) {
    const valor = input.value.trim();
    const soloLetras = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]+$/;

    if (!soloLetras.test(valor)) {
      mostrarError(input, "Ingrese nombre completo");
      return false;
    }

    if (valor.length < 15) {
      mostrarError(input, "El nombre debe tener al menos 15 caracteres.");
      return false;
    }

    return true;
  }

  // ====== Validar teléfono ======
  function validarTelefono(input) {
    const valor = input.value.trim();
    if (!/^09\d{8}$/.test(valor)) {
      mostrarError(input, "Ingrese un número de teléfono válido.");
      return false;
    }
    return true;
  }

  // ====== Validar cédula ======
  function validarCedula(input) {
    const valor = input.value.trim();
    if (!/^\d{10}$/.test(valor)) {
      mostrarError(input, "Ingrese un número de cédula válido.");
      return false;
    }
    return true;
  }

  // ====== Validar edad ======
  function validarEdad(input) {
    const valor = parseInt(input.value);
    if (isNaN(valor) || valor < 0 || valor > 120) {
      mostrarError(input, "Ingrese una edad válida.");
      return false;
    }
    return true;
  }

// ====== Agregar nueva cita ======
appointmentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let valido = true;

  const cedula = appointmentForm.querySelector('input[placeholder="Cédula del Paciente"]');
  const nombre = appointmentForm.querySelector('input[placeholder="Nombre completo"]');
  const fecha = document.getElementById("fecha");
  const hora = document.getElementById("hora");
  const consulta = document.getElementById("consulta");
  const sexo = appointmentForm.querySelector("#sexo");
  const edad = appointmentForm.querySelector("#edad");
  const telefono = appointmentForm.querySelector("#telefono");
  const email = appointmentForm.querySelector("#email");

  // 🔹 Limpiar errores anteriores
  appointmentForm.querySelectorAll(".error-msg").forEach(e => e.remove());
  const campos = [cedula, nombre, fecha, hora, consulta, sexo, edad, telefono, email];

  // 🔹 Validar campos vacíos con animación y color rojo
  campos.forEach(campo => {
    if (!campo.value.trim()) {
      mostrarError(campo, "Este campo es obligatorio.");
      valido = false;
      campo.classList.add("shake");
      setTimeout(() => campo.classList.remove("shake"), 500);
    }
  });

  if (!valido) return;

  // 🔹 Validaciones adicionales
  if (!validarCedula(cedula)) valido = false;
  if (!validarNombre(nombre)) valido = false;
  if (!validarEdad(edad)) valido = false;
  if (!validarTelefono(telefono)) valido = false;

  if (!valido) return;

  // 🔹 Crear nueva cita
  const nuevaCita = {
    hora: hora.value,
    paciente: nombre.value,
    consulta: consulta.value,
    estado: "Pendiente",
  };

  citas.push(nuevaCita);
  renderCitas();
  actualizarEstadisticas();
  closeAppointmentModal();
  appointmentForm.reset();
});



  // ====== Renderizar citas ======
  function renderCitas() {
    appointmentTable.innerHTML = "";
    citas.forEach((cita) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${cita.hora}</td>
        <td>${cita.paciente}</td>
        <td>${cita.consulta}</td>
        <td><span class="status pending">${cita.estado}</span></td>
        <td class="actions">
          <button><i class="fa-solid fa-phone"></i></button>
          <button><i class="fa-solid fa-envelope"></i></button>
        </td>
      `;
      appointmentTable.appendChild(row);
    });
  }

  // ====== Actualizar estadísticas ======
  function actualizarEstadisticas() {
    const total = citas.length;
    const confirmadas = citas.filter((c) => c.estado === "Confirmada").length;
    const pendientes = total - confirmadas;

    totalCitasEl.textContent = total;
    confirmedCitasEl.textContent = confirmadas;
    pendingCitasEl.textContent = pendientes;
  }



// ====== Registro rápido de paciente ======
registerBtn.addEventListener("click", (e) => {
  e.preventDefault();
  let valido = true;

  // Eliminar mensajes previos (errores o éxito)
  registerForm.querySelectorAll(".error-msg, .success-msg").forEach(e => e.remove());

  const inputs = registerForm.querySelectorAll("input, select");
  const [cedula, nombre, sexo, edad, telefono, correo] = inputs;

  // Validar vacíos con efecto visual
  inputs.forEach(input => {
    if (!input.value.trim()) {
      mostrarError(input, "Este campo no puede estar vacío");
      valido = false;
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 500);
    }
  });

  if (!valido) return;

  // Validaciones específicas
  if (!validarCedula(cedula)) valido = false;
  if (!validarNombre(nombre)) valido = false;
  if (!sexo.value) { mostrarError(sexo, "Seleccione el sexo."); valido = false; }
  if (!validarEdad(edad)) valido = false;
  if (!validarTelefono(telefono)) valido = false;
  if (correo.value.trim() === "") { mostrarError(correo, "Ingrese un correo válido."); valido = false; }

  if (!valido) return;

  // Agregar paciente
  pacientes.push({
    cedula: cedula.value,
    nombre: nombre.value,
    sexo: sexo.value,
    edad: edad.value,
    telefono: telefono.value,
    correo: correo.value
  });

  // Mostrar mensaje verde
  const success = document.createElement("p");
  success.classList.add("success-msg");
  success.textContent = "✅ Registro exitoso";
  registerForm.appendChild(success);

  // Vaciar formulario inmediatamente
  registerForm.reset();

  // Eliminar mensaje con animación y luego del DOM
  setTimeout(() => {
    success.style.transition = "opacity 0.5s ease";
    success.style.opacity = "0";
    setTimeout(() => {
      if (success && success.parentNode) {
        success.parentNode.removeChild(success);
      }
    }, 500);
  }, 2000);
});



}); 

// ===========================
// MODAL DE CERRAR SESIÓN
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.querySelector('.logout-link');
  const logoutModal = document.getElementById('logoutModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');

  if (!logoutLink || !logoutModal) return;

  // Abrir modal
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModal.style.display = 'flex';
    setTimeout(() => logoutModal.classList.add('show'), 10);
  });

  // Cerrar con botón "Cancelar"
  cancelLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
    setTimeout(() => (logoutModal.style.display = 'none'), 200);
  });

  // Confirmar cierre
  confirmLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
    setTimeout(() => {
      window.location.href = '../../html/loginRecepcionista.html';
    }, 200);
  });

  // Cerrar al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.classList.remove('show');
      setTimeout(() => (logoutModal.style.display = 'none'), 200);
    }
  });
});


