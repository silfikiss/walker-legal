// ===== Логика анкеты Walker Legal =====

let clientType = null;
let answers = {};

// Данные анкеты
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
        consultation: { question: 'Опишите ваш запрос:', textarea: true },
        contract: {
            question: 'Что нужно сделать с договором?',
            options: ['Составить новый договор', 'Проверить существующий договор', 'Согласовать изменения', 'Другое']
        },
        negotiations: { question: 'Опишите ситуацию с переговорами:', textarea: true },
        debt: {
            question: 'Какая ситуация с задолженностью?',
            options: ['Нужно подготовить претензию', 'Долг уже просужен, нужно взыскание', 'Нужно защищаться от требований', 'Другое']
        },
        litigation: {
            question: 'На какой стадии судебный спор?',
            options: ['Только планируем подавать иск', 'Иск подан, идёт рассмотрение', 'Есть решение, нужно обжаловать', 'Другое']
        },
        support: {
            question: 'Какой формат поддержки вам нужен?',
            options: ['Разовые консультации', 'Абонентское обслуживание', 'Комплексное сопровождение', 'Другое']
        },
        corporate: {
            question: 'Какой корпоративный вопрос?',
            options: ['Создание компании', 'Конфликт владельцев', 'Корпоративные процедуры', 'Другое']
        },
        labor: {
            question: 'Какой трудовой вопрос?',
            options: ['Трудовые договоры', 'Увольнение работника', 'Спор с работником', 'Другое']
        },
        ip: {
            question: 'Что нужно защитить?',
            options: ['Товарный знак', 'Авторские права', 'Патенты', 'Контент и сайт', 'Другое']
        },
        advertising: {
            question: 'Какой вопрос по рекламе и данным?',
            options: ['Рекламные материалы', 'Персональные данные', 'Сайт и документация', 'Другое']
        },
        construction: {
            question: 'Какой вопрос по строительству?',
            options: ['Договор подряда', 'Спор с подрядчиком', 'Разрешительная документация', 'Другое']
        },
        government: {
            question: 'Какой вопрос по госоргану?',
            options: ['Проверка', 'Ответ на предписание', 'Обжалование решения', 'Другое']
        },
        special: { question: 'Опишите ваш вопрос кратко:', textarea: true },
        audit: {
            question: 'Что нужно проверить?',
            options: ['Договоры', 'Интеллектуальная собственность', 'Кадровые документы', 'Всё сразу', 'Другое']
        },
        multiple: { question: 'Опишите задачи, которые нужно решить:', textarea: true }
    },

    individualDetails: {
        contract: {
            question: 'Что нужно сделать с договором?',
            options: ['Составить новый договор', 'Проверить существующий договор', 'Согласовать изменения', 'Другое']
        },
        litigation: {
            question: 'На какой стадии судебный спор?',
            options: ['Только планируем подавать иск', 'Иск подан, идёт рассмотрение', 'Есть решение, нужно обжаловать', 'Другое']
        },
        negotiations: { question: 'Опишите ситуацию:', textarea: true },
        debt: {
            question: 'Какая ситуация с задолженностью?',
            options: ['Нужно подготовить претензию', 'Долг уже просужен, нужно взыскание', 'Нужно защищаться от требований', 'Другое']
        },
        ip: {
            question: 'Что нужно защитить?',
            options: ['Авторские права', 'Контент', 'Товарный знак', 'Другое']
        },
        property: {
            question: 'Какой имущественный вопрос?',
            options: ['Недвижимость', 'Наследство', 'Раздел имущества', 'Другое']
        },
        labor: {
            question: 'Какой трудовой вопрос?',
            options: ['Трудовой договор', 'Увольнение', 'Спор с работодателем', 'Другое']
        },
        bankruptcy: { question: 'Опишите вашу ситуацию:', textarea: true },
        other: { question: 'Опишите ваш вопрос:', textarea: true }
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

// Выбор типа клиента
function selectClientType(type) {
    clientType = type;
    answers.clientType = type;

    document.getElementById('step-1').classList.remove('active');

    const container = document.getElementById('quiz-container');
    container.innerHTML = '';

    const tasks = type === 'business' ? quizData.businessTasks : quizData.individualTasks;

    let html = '<div class="quiz-step active">';
    html += '<h2>' + tasks.question + '</h2>';
    html += '<div class="quiz-buttons">';
    tasks.options.forEach(option => {
        html += '<button class="quiz-btn" onclick="selectTask(\'' + option.value + '\')">' + option.label + '</button>';
    });
    html += '</div></div>';

    container.innerHTML = html;
    updateProgress(30);
}

// Выбор задачи
function selectTask(task) {
    answers.task = task;

    const container = document.getElementById('quiz-container');
    container.innerHTML = '';

    const details = clientType === 'business' ? quizData.businessDetails : quizData.individualDetails;
    const detail = details[task];

    if (detail) {
        let html = '<div class="quiz-step active">';
        html += '<h2>' + detail.question + '</h2>';

        if (detail.textarea) {
            html += '<div class="quiz-form">';
            html += '<textarea id="detail-text" placeholder="Опишите ваш вопрос"></textarea>';
            html += '<button class="btn btn-primary" onclick="selectDetail()">Далее</button>';
            html += '</div>';
        } else {
            html += '<div class="quiz-buttons">';
            detail.options.forEach(option => {
                html += '<button class="quiz-btn" onclick="selectDetail(\'' + option + '\')">' + option + '</button>';
            });
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
        updateProgress(60);
    } else {
        showContacts();
    }
}

// Выбор уточнения
function selectDetail(detail) {
    if (detail) {
        answers.detail = detail;
    } else {
        const text = document.getElementById('detail-text');
        if (text) answers.detail = text.value;
    }

    showContacts();
    updateProgress(80);
}

// Показать контактные данные
function showContacts() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';

    const contacts = quizData.contacts;

    let html = '<div class="quiz-step active">';
    html += '<h2>' + contacts.question + '</h2>';
    html += '<div class="quiz-form">';

    contacts.fields.forEach(field => {
        html += '<label>' + field.label + (field.required ? ' *' : '') + '</label>';
        html += '<input type="' + field.type + '" id="field-' + field.name + '" ' + (field.required ? 'required' : '') + '>';
    });

    html += '<label class="consent-label">';
    html += '<input type="checkbox" id="consent" onchange="toggleSubmit()">';
    html += ' Согласен на обработку персональных данных';
    html += '</label>';
    html += '<button class="btn btn-primary" id="submit-btn" onclick="submitQuiz()" disabled>Отправить</button>';
    html += '</div></div>';

    container.innerHTML = html;
    updateProgress(90);
}

// Активация кнопки отправки
function toggleSubmit() {
    const consent = document.getElementById('consent');
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = !consent.checked;
}

// Отправка анкеты
function submitQuiz() {
    const name = document.getElementById('field-name')?.value || '';
    const email = document.getElementById('field-email')?.value || '';
    const phone = document.getElementById('field-phone')?.value || '';

    answers.name = name;
    answers.email = email;
    answers.phone = phone;

    console.log('Анкета отправлена:', answers);

    const container = document.getElementById('quiz-container');
    container.innerHTML = '';

    let html = '<div class="quiz-step active">';
    html += '<h2>Спасибо!</h2>';
    html += '<p>Мы получили вашу заявку и свяжемся с вами в ближайшее время.</p>';
    html += '</div>';

    container.innerHTML = html;
    updateProgress(100);
}

// Обновление прогресс-бара
function updateProgress(percent) {
    document.getElementById('progress-bar').style.width = percent + '%';
}