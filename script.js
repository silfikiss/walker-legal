// ===== Логика анкеты Walker Legal =====

let clientType = null;
let answers = {};
let currentStep = 0;
const totalSteps = 4; // type → task → details → contacts

const quizData = {
    clientType: {
        question: 'Кто обращается?',
        options: [
            { value: 'business', label: 'Я представляю бизнес / ИП' },
            { value: 'individual', label: 'Я частное лицо' }
        ]
    },

    businessTasks: {
        question: 'С какой задачей вы пришли?',
        options: [
            { value: 'consultation', label: 'Консультация / не знаю формат' },
            { value: 'contract', label: 'Договор' },
            { value: 'negotiations', label: 'Переговоры или конфликт без суда' },
            { value: 'debt', label: 'Долг / претензия / взыскание' },
            { value: 'litigation', label: 'Судебный спор' },
            { value: 'support', label: 'Постоянная юридическая поддержка' },
            { value: 'corporate', label: 'Корпоративный вопрос / конфликт владельцев' },
            { value: 'labor', label: 'Сотрудники и трудовые вопросы' },
            { value: 'ip', label: 'Бренд, контент и интеллектуальные права' },
            { value: 'advertising', label: 'Реклама, сайт и персональные данные' },
            { value: 'construction', label: 'Архитектура, дизайн, строительство' },
            { value: 'government', label: 'Госорган' },
            { value: 'special', label: 'Специальный вопрос' },
            { value: 'audit', label: 'Комплексный аудит' },
            { value: 'multiple', label: 'Несколько задач / не знаю, что выбрать' }
        ]
    },

    individualTasks: {
        question: 'С какой задачей вы пришли?',
        options: [
            { value: 'contract', label: 'Договор (составление/проверка)' },
            { value: 'litigation', label: 'Судебный спор' },
            { value: 'negotiations', label: 'Переговоры или конфликт без суда' },
            { value: 'debt', label: 'Долг / претензия / взыскание' },
            { value: 'ip', label: 'Авторское право / интеллектуальные права' },
            { value: 'property', label: 'Имущественные и наследственные вопросы' },
            { value: 'labor', label: 'Трудовые вопросы' },
            { value: 'bankruptcy', label: 'Банкротство' },
            { value: 'other', label: 'Другое' }
        ]
    },

    businessDetails: {
        consultation: { question: 'Опишите ваш запрос:', fields: [{ name: 'description', label: 'Кратко опишите ситуацию', type: 'textarea', required: false }] },
        contract: { question: 'Что нужно сделать с договором?', fields: [{ name: 'action', label: 'Что нужно сделать?', type: 'select', options: ['Составить новый договор', 'Проверить существующий договор', 'Согласовать изменения', 'Другое'] }, { name: 'amount', label: 'Сумма договора (если применимо)', type: 'text', required: false }, { name: 'deadline', label: 'Сроки (если есть)', type: 'text', required: false }] },
        negotiations: { question: 'Опишите ситуацию с переговорами:', fields: [{ name: 'description', label: 'Кратко опишите ситуацию', type: 'textarea', required: false }] },
        debt: { question: 'Какая ситуация с задолженностью?', fields: [{ name: 'stage', label: 'Стадия', type: 'select', options: ['Нужно подготовить претензию', 'Долг уже просужен, нужно взыскание', 'Нужно защищаться от требований', 'Другое'] }, { name: 'amount', label: 'Сумма задолженности', type: 'text', required: false }] },
        litigation: { question: 'Опишите судебный спор:', fields: [{ name: 'stage', label: 'Стадия спора', type: 'select', options: ['Только планируем подавать иск', 'Иск подан, идёт рассмотрение', 'Есть решение, нужно обжаловать', 'Другое'] }, { name: 'court', label: 'Наименование суда (если есть)', type: 'text', required: false }, { name: 'case_number', label: 'Номер дела (если есть)', type: 'text', required: false }] },
        support: { question: 'Какой формат поддержки вам нужен?', fields: [{ name: 'format', label: 'Формат', type: 'select', options: ['Разовые консультации', 'Абонентское обслуживание', 'Комплексное сопровождение', 'Другое'] }] },
        corporate: { question: 'Какой корпоративный вопрос?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Создание компании', 'Конфликт владельцев', 'Корпоративные процедуры', 'Другое'] }] },
        labor: { question: 'Какой трудовой вопрос?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Трудовые договоры', 'Увольнение работника', 'Спор с работником', 'Другое'] }] },
        ip: { question: 'Что нужно защитить?', fields: [{ name: 'object', label: 'Объект', type: 'select', options: ['Товарный знак', 'Авторские права', 'Патенты', 'Контент и сайт', 'Другое'] }] },
        advertising: { question: 'Какой вопрос по рекламе и данным?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Рекламные материалы', 'Персональные данные', 'Сайт и документация', 'Другое'] }] },
        construction: { question: 'Какой вопрос по строительству?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Договор подряда', 'Спор с подрядчиком', 'Разрешительная документация', 'Другое'] }] },
        government: { question: 'Какой вопрос по госоргану?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Проверка', 'Ответ на предписание', 'Обжалование решения', 'Другое'] }] },
        special: { question: 'Опишите ваш вопрос:', fields: [{ name: 'description', label: 'Кратко опишите', type: 'textarea', required: false }] },
        audit: { question: 'Что нужно проверить?', fields: [{ name: 'objects', label: 'Что проверяем?', type: 'select', options: ['Договоры', 'Интеллектуальная собственность', 'Кадровые документы', 'Всё сразу', 'Другое'] }] },
        multiple: { question: 'Опишите задачи:', fields: [{ name: 'description', label: 'Какие задачи нужно решить?', type: 'textarea', required: false }] }
    },

    individualDetails: {
        contract: { question: 'Что нужно сделать с договором?', fields: [{ name: 'action', label: 'Что нужно сделать?', type: 'select', options: ['Составить новый договор', 'Проверить существующий договор', 'Согласовать изменения', 'Другое'] }] },
        litigation: { question: 'На какой стадии судебный спор?', fields: [{ name: 'stage', label: 'Стадия спора', type: 'select', options: ['Только планируем подавать иск', 'Иск подан, идёт рассмотрение', 'Есть решение, нужно обжаловать', 'Другое'] }, { name: 'description', label: 'Кратко опишите ситуацию', type: 'textarea', required: false }] },
        negotiations: { question: 'Опишите ситуацию:', fields: [{ name: 'description', label: 'Кратко опишите', type: 'textarea', required: false }] },
        debt: { question: 'Какая ситуация с задолженностью?', fields: [{ name: 'stage', label: 'Стадия', type: 'select', options: ['Нужно подготовить претензию', 'Долг уже просужен, нужно взыскание', 'Нужно защищаться от требований', 'Другое'] }, { name: 'amount', label: 'Сумма задолженности', type: 'text', required: false }] },
        ip: { question: 'Что нужно защитить?', fields: [{ name: 'object', label: 'Объект', type: 'select', options: ['Авторские права', 'Контент', 'Товарный знак', 'Другое'] }] },
        property: { question: 'Какой имущественный вопрос?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Недвижимость', 'Наследство', 'Раздел имущества', 'Другое'] }] },
        labor: { question: 'Какой трудовой вопрос?', fields: [{ name: 'type', label: 'Тип вопроса', type: 'select', options: ['Трудовой договор', 'Увольнение', 'Спор с работодателем', 'Другое'] }] },
        bankruptcy: { question: 'Опишите вашу ситуацию:', fields: [{ name: 'description', label: 'Кратко опишите ситуацию', type: 'textarea', required: false }, { name: 'amount', label: 'Общая сумма задолженности', type: 'text', required: false }, { name: 'status', label: 'Статус процедуры', type: 'select', options: ['Процедура не начата', 'Процедура уже идёт', 'Не знаю', 'Другое'] }] },
        other: { question: 'Опишите ваш вопрос:', fields: [{ name: 'description', label: 'Кратко опишите', type: 'textarea', required: false }] }
    },

    contacts: {
        question: 'Как с вами связаться?',
        fields: [
            { name: 'name', label: 'Ваше имя', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Телефон', type: 'tel', required: false }
        ]
    }
};

// ===== Рендеринг шагов =====
function renderStep(stepName, data) {
    const container = document.getElementById('quiz-container');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'quiz-step active';

    let html = `<h2>${data.question}</h2>`;

    if (data.options) {
        // Кнопки-варианты
        html += '<div class="quiz-buttons">';
        data.options.forEach(opt => {
            html += `<button class="quiz-btn" onclick="handleOptionClick('${stepName}', '${opt.value}')">${opt.label}</button>`;
        });
        html += '</div>';
    } else if (data.fields) {
        // Поля формы
        html += '<div class="quiz-form">';
        data.fields.forEach(field => {
            const required = field.required ? ' required' : '';
            html += `<label>${field.label}${field.required ? ' *' : ''}</label>`;
            if (field.type === 'textarea') {
                html += `<textarea id="field-${field.name}" placeholder="${field.label}"${required}></textarea>`;
            } else if (field.type === 'select') {
                html += `<select id="field-${field.name}"${required}>`;
                html += '<option value="">Выберите...</option>';
                field.options.forEach(opt => {
                    html += `<option value="${opt}">${opt}</option>`;
                });
                html += '</select>';
            } else {
                html += `<input type="${field.type}" id="field-${field.name}"${required}>`;
            }
        });
        // Если это шаг с контактами – добавляем чекбокс согласия
        if (stepName === 'contacts') {
            html += `<label class="consent-label">
                        <input type="checkbox" id="consent" onchange="toggleSubmit()">
                        Согласен на обработку персональных данных
                    </label>`;
        }
        const btnLabel = (stepName === 'contacts') ? 'Отправить' : 'Далее';
        const onClick = (stepName === 'contacts') ? 'submitQuiz()' : 'handleFormNext()';
        html += `<button class="btn btn-primary" id="submit-btn" onclick="${onClick}" ${stepName === 'contacts' ? 'disabled' : ''}>${btnLabel}</button>`;
        html += '</div>';
    }

    stepDiv.innerHTML = html;
    container.innerHTML = '';
    container.appendChild(stepDiv);

    // Обновить прогресс
    updateProgress(stepName);
}

// ===== Обработка клика по варианту =====
function handleOptionClick(stepName, value) {
    if (stepName === 'clientType') {
        clientType = value;
        answers.clientType = value;
        const tasks = value === 'business' ? quizData.businessTasks : quizData.individualTasks;
        renderStep('task', tasks);
    } else if (stepName === 'task') {
        answers.task = value;
        const details = clientType === 'business' ? quizData.businessDetails : quizData.individualDetails;
        const detail = details[value];
        if (detail) {
            renderStep('details', detail);
        } else {
            renderStep('contacts', quizData.contacts);
        }
    }
}

// ===== Обработка формы (Далее) =====
function handleFormNext() {
    const container = document.getElementById('quiz-container');
    const fields = container.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        if (field.id && field.id !== 'consent') {
            const key = field.id.replace('field-', '');
            answers[key] = field.value;
        }
    });
    renderStep('contacts', quizData.contacts);
}

// ===== Активация кнопки отправки =====
function toggleSubmit() {
    const consent = document.getElementById('consent');
    const btn = document.getElementById('submit-btn');
    if (btn) btn.disabled = !consent.checked;
}

// ===== Отправка анкеты =====
function submitQuiz() {
    const container = document.getElementById('quiz-container');
    const fields = container.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        if (field.id && field.id !== 'consent') {
            const key = field.id.replace('field-', '');
            answers[key] = field.value;
        }
    });

    console.log('Анкета отправлена:', answers);

    // Показать спасибо
    const stepDiv = document.createElement('div');
    stepDiv.className = 'quiz-step active';
    stepDiv.innerHTML = `
        <h2>Спасибо!</h2>
        <p>Мы получили вашу заявку и свяжемся с вами в ближайшее время.</p>
    `;
    container.innerHTML = '';
    container.appendChild(stepDiv);
    updateProgress('done');
}

// ===== Прогресс-бар =====
function updateProgress(stepName) {
    const bar = document.getElementById('progress-bar');
    const steps = ['clientType', 'task', 'details', 'contacts', 'done'];
    const index = steps.indexOf(stepName);
    let percent = 0;
    if (index === 0) percent = 10;
    else if (index === 1) percent = 35;
    else if (index === 2) percent = 65;
    else if (index === 3) percent = 90;
    else if (index === 4) percent = 100;
    bar.style.width = percent + '%';
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', function() {
    renderStep('clientType', quizData.clientType);
});
