// ===== script.js =====
// Основная логика анкеты (данные в quiz-data.js)

let clientType = null;
let answers = {};
let stepHistory = [];
let currentStepName = null;

const STEP_ORDER = ['clientType', 'task', 'details', 'contacts'];

// ===== Рендеринг шага =====
function renderStep(stepName, data) {
    const container = document.getElementById('quiz-container');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'quiz-step';

    const stepIndex = STEP_ORDER.indexOf(stepName);
    const showProgress = stepIndex !== -1;
    let stepNumber = showProgress ? stepIndex + 1 : 0;
    let totalSteps = STEP_ORDER.length;

    let html = `<h2>${data.question}</h2>`;

    if (data.options) {
        html += '<div class="quiz-buttons">';
        data.options.forEach(opt => {
            let btnClass = 'quiz-btn';
            if (opt.isPackage) btnClass += ' package-btn';
            html += `<button class="${btnClass}" onclick="handleOptionClick('${stepName}', '${opt.value}')">${opt.label}</button>`;
        });
        html += '</div>';
    } else if (data.fields) {
        html += '<div class="quiz-form">';
        data.fields.forEach(field => {
            const requiredAttr = field.required ? ' required' : '';
            html += `<label>${field.label}${field.required ? ' <span class="required-star">*</span>' : ''}</label>`;
            if (field.type === 'textarea') {
                html += `<textarea id="field-${field.name}" placeholder="${field.label}"${requiredAttr}></textarea>`;
            } else if (field.type === 'select') {
                html += `<select id="field-${field.name}"${requiredAttr}>`;
                html += '<option value="">Выберите...</option>';
                field.options.forEach(opt => {
                    html += `<option value="${opt}">${opt}</option>`;
                });
                html += '</select>';
            } else {
                html += `<input type="${field.type}" id="field-${field.name}" placeholder="${field.label}"${requiredAttr}>`;
            }
        });
        if (stepName === 'contacts') {
            html += `<label class="consent-label">
                        <input type="checkbox" id="consent" onchange="toggleSubmit()">
                        Согласен на обработку персональных данных
                    </label>`;
        }
        const btnLabel = (stepName === 'contacts') ? 'Отправить' : 'Далее';
        const onClick = (stepName === 'contacts') ? 'submitQuiz()' : 'handleFormNext()';
        html += `<div class="form-actions">`;
        // Кнопка "Назад" – если есть история или это не первый шаг
        if (stepHistory.length > 0 || stepName !== 'clientType') {
            html += `<button type="button" class="btn btn-secondary" onclick="goBack()">← Назад</button>`;
        }
        html += `<button class="btn btn-primary" id="submit-btn" onclick="${onClick}" ${stepName === 'contacts' ? 'disabled' : ''}>${btnLabel}</button>`;
        html += `</div>`;
        html += '</div>';
    }

    stepDiv.innerHTML = html;
    container.innerHTML = '';
    container.appendChild(stepDiv);

    // Обработчики для снятия подсветки ошибок и проверки при потере фокуса
    container.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', function() {
            this.classList.remove('error');
        });
        el.addEventListener('change', function() {
            this.classList.remove('error');
        });
        el.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    });

    // Плавное появление
    requestAnimationFrame(() => {
        stepDiv.classList.add('active');
    });

    if (showProgress) {
        updateProgress(stepName, stepNumber, totalSteps);
    } else {
        updateProgress(stepName);
    }
}

// ===== Обработка выбора варианта =====
function handleOptionClick(stepName, value) {
    const data = window.quizData;
    if (!data) {
        console.error('quizData не загружен!');
        return;
    }
    if (stepName === 'clientType') {
        clientType = value;
        answers.clientType = value;
        const tasks = value === 'business' ? data.businessTasks : data.individualTasks;
        stepHistory.push('clientType');
        currentStepName = 'task';
        renderStep('task', tasks);
    } else if (stepName === 'task') {
        answers.task = value;
        const details = clientType === 'business' ? data.businessDetails : data.individualDetails;
        const detail = details[value];
        stepHistory.push('task');
        currentStepName = 'details';
        if (detail) {
            renderStep('details', detail);
        } else {
            // Если нет деталей, переходим сразу к контактам
            currentStepName = 'contacts';
            renderStep('contacts', data.contacts);
        }
    }
}

// ===== Обработка нажатия "Далее" в форме =====
function handleFormNext() {
    const container = document.getElementById('quiz-container');
    const fields = container.querySelectorAll('input, select, textarea');
    let isValid = true;
    fields.forEach(field => {
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
        if (field.id && field.id !== 'consent') {
            const key = field.id.replace('field-', '');
            answers[key] = field.value;
        }
    });
    if (!isValid) {
        return;
    }
    stepHistory.push('details');
    currentStepName = 'contacts';
    const data = window.quizData;
    renderStep('contacts', data.contacts);
}

// ===== Кнопка "Назад" =====
function goBack() {
    if (stepHistory.length === 0) return;
    const prevStep = stepHistory.pop();
    const data = window.quizData;
    if (!data) return;
    if (prevStep === 'clientType') {
        currentStepName = 'clientType';
        renderStep('clientType', data.clientType);
    } else if (prevStep === 'task') {
        const tasks = clientType === 'business' ? data.businessTasks : data.individualTasks;
        currentStepName = 'task';
        renderStep('task', tasks);
    } else if (prevStep === 'details') {
        const details = clientType === 'business' ? data.businessDetails : data.individualDetails;
        const detail = details[answers.task];
        if (detail) {
            currentStepName = 'details';
            renderStep('details', detail);
        } else {
            // Если деталей нет, возвращаемся на task
            goBack();
        }
    }
}

// ===== Активация кнопки отправки =====
function toggleSubmit() {
    const consent = document.getElementById('consent');
    const btn = document.getElementById('submit-btn');
    if (btn) {
        btn.disabled = !consent.checked;
    }
}

// ===== Отправка анкеты =====
function submitQuiz() {
    const container = document.getElementById('quiz-container');
    const fields = container.querySelectorAll('input, select, textarea');
    let isValid = true;
    fields.forEach(field => {
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
        if (field.id && field.id !== 'consent') {
            const key = field.id.replace('field-', '');
            answers[key] = field.value;
        }
    });
    const consent = document.getElementById('consent');
    if (!consent || !consent.checked) {
        isValid = false;
        if (consent) consent.classList.add('error');
    } else {
        if (consent) consent.classList.remove('error');
    }
    if (!isValid) {
        return;
    }

    console.log('Анкета отправлена:', answers);

    // Финальный экран с кнопкой "Заполнить заново"
    const stepDiv = document.createElement('div');
    stepDiv.className = 'quiz-step active';
    stepDiv.innerHTML = `
        <h2>Спасибо!</h2>
        <p>Запрос получен. Мы изучим ответы и свяжемся с вами, чтобы уточнить задачу и предложить подходящий формат работы. Подробные обстоятельства и документы можно будет обсудить на первом звонке.</p>
        <button class="btn btn-primary" onclick="location.reload()">Заполнить заново</button>
    `;
    container.innerHTML = '';
    container.appendChild(stepDiv);
    updateProgress('done');
}

// ===== Прогресс-бар =====
function updateProgress(stepName, stepNumber, totalSteps) {
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    const steps = ['clientType', 'task', 'details', 'contacts', 'done'];
    const index = steps.indexOf(stepName);
    let percent = 0;
    if (index === 0) percent = 10;
    else if (index === 1) percent = 35;
    else if (index === 2) percent = 65;
    else if (index === 3) percent = 90;
    else if (index === 4) percent = 100;
    bar.style.width = percent + '%';
    if (label) {
        if (stepName === 'done') {
            label.textContent = 'Готово!';
        } else if (stepNumber !== undefined && totalSteps !== undefined) {
            label.textContent = `Шаг ${stepNumber} из ${totalSteps}`;
        } else {
            label.textContent = '';
        }
    }
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', function() {
    const data = window.quizData;
    if (!data) {
        console.error('quizData не найден. Убедитесь, что quiz-data.js загружен перед script.js');
        return;
    }
    const progressContainer = document.querySelector('.progress');
    if (progressContainer) {
        let label = document.getElementById('progress-label');
        if (!label) {
            label = document.createElement('div');
            label.id = 'progress-label';
            label.className = 'progress-label';
            progressContainer.parentNode.insertBefore(label, progressContainer);
        }
    }
    renderStep('clientType', data.clientType);
    currentStepName = 'clientType';
    updateProgress('clientType', 1, STEP_ORDER.length);
});
