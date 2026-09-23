// ==========================================
// WALKER LEGAL — общий скрипт сайта
// 1. Мобильное меню
// 2. Раскрывающиеся карточки пакетов
// 3. Анкета (только на странице services.html)
// ==========================================

(function () {
    'use strict';

    // ==========================================
    // 1. МОБИЛЬНОЕ МЕНЮ
    // ==========================================

    function initNav() {
        const toggle = document.querySelector('.nav-toggle');
        const nav = document.getElementById('site-nav');

        if (!toggle || !nav) {
            return;
        }

        function setOpen(open) {
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
            nav.classList.toggle('open', open);
        }

        toggle.addEventListener('click', () => {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && nav.classList.contains('open')) {
                setOpen(false);
                toggle.focus();
            }
        });
    }


    // ==========================================
    // 2. КАРТОЧКИ ПАКЕТОВ
    // ==========================================

    function initPackages() {
        document.querySelectorAll('.toggle-package').forEach(button => {
            const target = document.getElementById(button.getAttribute('aria-controls'));

            if (!target) {
                return;
            }

            button.addEventListener('click', () => {
                const open = button.getAttribute('aria-expanded') === 'true';

                button.setAttribute('aria-expanded', String(!open));
                button.textContent = open ? 'Подробнее' : 'Скрыть';
                target.style.maxHeight = open ? '0' : target.scrollHeight + 'px';
            });
        });
    }


    // ==========================================
    // 3. АНКЕТА
    // ==========================================

    // Ключ Web3Forms (публичный по своей природе)
    const WEB3FORMS_KEY = '8c0237fe-b2fb-4dab-a9b1-6e9a4785fb96';
    const CONTACT_EMAIL = 'walkerlegal@yandex.ru';
    const CONSENT_VERSION = 'Согласие от 23.09.2026';

    const STEP_PROGRESS = {
        clientType: 0,
        task: 33,
        details: 66,
        contacts: 90,
        done: 100
    };

    // Поля контактов сохраняются, даже если человек вернулся и сменил задачу
    const CONTACT_FIELDS = ['name', 'email', 'phone', 'time'];

    let clientType = null;
    let answers = {};
    let stepHistory = [];
    let currentStepName = null;
    let selectedOption = null;


    function getQuizData() {
        return window.quizData || null;
    }

    function getContainer() {
        return document.getElementById('quiz-container');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function tasksFor(data) {
        return clientType === 'business' ? data.businessTasks : data.individualTasks;
    }

    function detailsFor(data) {
        return clientType === 'business' ? data.businessDetails : data.individualDetails;
    }

    // Оставить в ответах только контакты (+ указанные ключи)
    function keepOnlyContacts(extra) {
        const kept = Object.assign({}, extra);

        CONTACT_FIELDS.forEach(name => {
            if (answers[name] !== undefined) {
                kept[name] = answers[name];
            }
        });

        answers = kept;
    }


    // ------------------------------------------
    // Сохранение и проверка полей
    // ------------------------------------------

    function saveField(field) {
        if (!field || !field.name || field.name === 'consent' || field.name === 'botcheck') {
            return;
        }

        if (field.type === 'checkbox') {
            const group = getContainer().querySelectorAll(`input[type="checkbox"][name="${field.name}"]`);
            answers[field.name] = Array.from(group)
                .filter(item => item.checked)
                .map(item => item.value);
            return;
        }

        answers[field.name] = field.value.trim();
    }

    function validateForm() {
        const container = getContainer();

        if (!container) {
            return false;
        }

        let firstInvalid = null;

        container.querySelectorAll('.quiz-field').forEach(wrapper => {
            const group = wrapper.querySelector('.checkbox-group');

            // Группа чекбоксов
            if (group) {
                const boxes = group.querySelectorAll('input[type="checkbox"]');
                saveField(boxes[0]);

                const invalid = group.dataset.required === 'true' &&
                    !Array.from(boxes).some(box => box.checked);

                group.classList.toggle('error', invalid);

                if (invalid && !firstInvalid) {
                    firstInvalid = boxes[0];
                }
                return;
            }

            // Обычное поле
            const field = wrapper.querySelector('input, select, textarea');

            if (!field) {
                return;
            }

            saveField(field);

            // checkValidity учитывает и required, и формат email
            const invalid = !field.checkValidity() ||
                (field.required && !field.value.trim());

            field.classList.toggle('error', invalid);
            field.setAttribute('aria-invalid', String(invalid));

            if (invalid && !firstInvalid) {
                firstInvalid = field;
            }
        });

        if (firstInvalid) {
            showMessage(
                firstInvalid.type === 'email' && firstInvalid.value.trim()
                    ? 'Проверьте адрес электронной почты.'
                    : 'Заполните обязательные поля, отмеченные звёздочкой.'
            );
            firstInvalid.focus();
            return false;
        }

        showMessage('');
        return true;
    }

    function showMessage(text) {
        const box = document.getElementById('quiz-message');

        if (!box) {
            return;
        }

        box.textContent = text;
        box.hidden = !text;
    }


    // ------------------------------------------
    // Рендеринг полей
    // ------------------------------------------

    function renderField(field) {
        const id = `field-${escapeHtml(field.name)}`;
        const name = escapeHtml(field.name);
        const value = answers[field.name] ?? (field.type === 'checkboxes' ? [] : '');
        const required = field.required ? 'required' : '';
        const star = field.required ? ' <span class="required-star" aria-hidden="true">*</span>' : '';
        const placeholder = escapeHtml(field.placeholder || '');
        const autocomplete = field.autocomplete ? `autocomplete="${escapeHtml(field.autocomplete)}"` : '';

        // Несколько вариантов
        if (field.type === 'checkboxes') {
            const boxes = (field.options || []).map((option, index) => `
                <label class="checkbox-option">
                    <input type="checkbox" name="${name}" value="${escapeHtml(option)}"
                        id="${id}-${index}"
                        ${Array.isArray(value) && value.includes(option) ? 'checked' : ''}>
                    <span>${escapeHtml(option)}</span>
                </label>
            `).join('');

            return `
                <div class="quiz-field">
                    <fieldset class="checkbox-group" data-required="${field.required ? 'true' : 'false'}">
                        <legend>${escapeHtml(field.label)}${star}</legend>
                        ${boxes}
                    </fieldset>
                </div>
            `;
        }

        let control;

        if (field.type === 'textarea') {
            control = `
                <textarea id="${id}" name="${name}" placeholder="${placeholder}" ${required}>${escapeHtml(value)}</textarea>
            `;
        } else if (field.type === 'select') {
            const options = (field.options || []).map(option => `
                <option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>
                    ${escapeHtml(option)}
                </option>
            `).join('');

            control = `
                <select id="${id}" name="${name}" ${required}>
                    <option value="" ${value === '' ? 'selected' : ''} ${field.required ? 'disabled' : ''}>
                        ${field.required ? 'Выберите вариант' : 'Не выбрано'}
                    </option>
                    ${options}
                </select>
            `;
        } else {
            control = `
                <input type="${escapeHtml(field.type || 'text')}" id="${id}" name="${name}"
                    value="${escapeHtml(value)}" placeholder="${placeholder}" ${autocomplete} ${required}>
            `;
        }

        return `
            <div class="quiz-field">
                <label for="${id}">${escapeHtml(field.label)}${star}</label>
                ${control}
            </div>
        `;
    }


    // ------------------------------------------
    // Рендеринг шага
    // ------------------------------------------

    function backButton() {
        return stepHistory.length > 0
            ? '<button type="button" class="btn btn-secondary quiz-back-button">← Назад</button>'
            : '';
    }

    function renderStep(stepName, data, moveFocus = true) {
        const container = getContainer();

        if (!container || !data) {
            return;
        }

        currentStepName = stepName;

        let html = '';

        if (data.question) {
            html += `<h2 tabindex="-1">${escapeHtml(data.question)}</h2>`;
        }

        // Варианты-кнопки
        if (Array.isArray(data.options)) {
            html += '<div class="quiz-buttons">';

            data.options.forEach(option => {
                const isSelected = selectedOption !== null && String(selectedOption) === String(option.value);
                let className = 'quiz-btn';

                if (option.isPackage) {
                    className += ' package-btn';
                }
                if (isSelected) {
                    className += ' selected';
                }

                html += `
                    <button type="button" class="${className}"
                        data-value="${escapeHtml(option.value)}"
                        aria-pressed="${isSelected ? 'true' : 'false'}">
                        ${escapeHtml(option.label)}
                    </button>
                `;
            });

            html += `
                </div>
                <div class="form-actions">
                    ${backButton()}
                    <button type="button" class="btn btn-primary" id="next-btn" ${selectedOption === null ? 'disabled' : ''}>
                        Далее
                    </button>
                </div>
            `;
        }

        // Поля формы
        if (Array.isArray(data.fields)) {
            html += '<div class="quiz-form">';
            html += data.fields.map(renderField).join('');

            if (stepName === 'contacts') {
                html += `
                    <label class="consent-label">
                        <input type="checkbox" id="consent" name="consent">
                        <span>
                            Даю <a href="consent.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a>
                            в соответствии с <a href="privacy.html" target="_blank" rel="noopener">Политикой обработки персональных данных</a>
                        </span>
                    </label>

                    <!-- Ловушка для спам-ботов: человек это поле не видит -->
                    <input type="checkbox" name="botcheck" class="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
                `;
            }

            const isContacts = stepName === 'contacts';

            html += `
                    <div class="form-actions">
                        ${backButton()}
                        <button type="button" class="btn btn-primary" id="next-btn" ${isContacts ? 'disabled' : ''}>
                            ${isContacts ? 'Отправить заявку' : 'Далее'}
                        </button>
                    </div>
                </div>
            `;
        }

        html += '<p id="quiz-message" class="quiz-message" role="alert" hidden></p>';

        const step = document.createElement('div');
        step.className = 'quiz-step';
        step.innerHTML = html;

        container.innerHTML = '';
        container.appendChild(step);

        requestAnimationFrame(() => step.classList.add('active'));

        bindEvents(step, stepName, data);
        updateProgress(stepName);

        // Переносим фокус на заголовок нового шага (кроме первой загрузки)
        if (moveFocus) {
            const heading = step.querySelector('h2');
            if (heading) {
                heading.focus({ preventScroll: true });
                document.getElementById('quiz').scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        }
    }


    // ------------------------------------------
    // События
    // ------------------------------------------

    function bindEvents(step, stepName, data) {
        // Выбор варианта
        step.querySelectorAll('.quiz-btn').forEach(button => {
            button.addEventListener('click', () => {
                selectedOption = button.dataset.value;

                step.querySelectorAll('.quiz-btn').forEach(item => {
                    item.classList.remove('selected');
                    item.setAttribute('aria-pressed', 'false');
                });

                button.classList.add('selected');
                button.setAttribute('aria-pressed', 'true');

                const next = step.querySelector('#next-btn');
                if (next) {
                    next.disabled = false;
                }
            });
        });

        // Назад
        step.querySelectorAll('.quiz-back-button').forEach(button => {
            button.addEventListener('click', goBack);
        });

        // Поля
        step.querySelectorAll('input, select, textarea').forEach(field => {
            const onChange = () => {
                field.classList.remove('error');
                field.removeAttribute('aria-invalid');
                const group = field.closest('.checkbox-group');
                if (group) {
                    group.classList.remove('error');
                }
                saveField(field);
                updateSubmitButton();
            };

            field.addEventListener('input', onChange);
            field.addEventListener('change', onChange);
        });

        // Enter в однострочном поле = «Далее»
        step.querySelectorAll('input:not([type="checkbox"])').forEach(input => {
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const next = step.querySelector('#next-btn');
                    if (next && !next.disabled) {
                        next.click();
                    }
                }
            });
        });

        const next = step.querySelector('#next-btn');

        if (!next) {
            return;
        }

        if (stepName === 'contacts') {
            next.addEventListener('click', submitQuiz);
            updateSubmitButton();
        } else if (Array.isArray(data.options)) {
            next.addEventListener('click', handleOptionNext);
        } else {
            next.addEventListener('click', handleFormNext);
        }
    }

    function updateSubmitButton() {
        const consent = document.getElementById('consent');
        const next = document.getElementById('next-btn');

        if (consent && next) {
            next.disabled = !consent.checked;
        }
    }


    // ------------------------------------------
    // Навигация
    // ------------------------------------------

    function handleOptionNext() {
        const data = getQuizData();

        if (!data || selectedOption === null) {
            return;
        }

        // Шаг 1: кто обращается
        if (currentStepName === 'clientType') {
            if (clientType !== selectedOption) {
                // Сменили тип клиента — прежние ответы о задаче больше не актуальны
                keepOnlyContacts({});
            }

            clientType = selectedOption;
            answers.clientType = clientType;
            stepHistory = ['clientType'];

            selectedOption = answers.task || null;
            renderStep('task', tasksFor(data));
            return;
        }

        // Шаг 2: основная задача
        if (currentStepName === 'task') {
            const task = selectedOption;

            if (answers.task !== task) {
                // Сменили задачу — удаляем ответы от предыдущей задачи
                keepOnlyContacts({ clientType });
            }

            answers.task = task;
            stepHistory.push('task');
            selectedOption = null;

            const detail = detailsFor(data)[task];

            if (detail) {
                renderStep('details', detail);
            } else {
                renderStep('contacts', data.contacts);
            }
        }
    }

    function handleFormNext() {
        if (!validateForm()) {
            return;
        }

        const data = getQuizData();

        if (!data) {
            return;
        }

        stepHistory.push('details');
        renderStep('contacts', data.contacts);
    }

    function goBack() {
        const data = getQuizData();

        if (!data || stepHistory.length === 0) {
            return;
        }

        // Сохраняем то, что уже введено на текущем шаге
        getContainer()
            .querySelectorAll('input, select, textarea')
            .forEach(saveField);

        const previousStep = stepHistory.pop();

        if (previousStep === 'clientType') {
            selectedOption = clientType;
            renderStep('clientType', data.clientType);
            return;
        }

        if (previousStep === 'task') {
            selectedOption = answers.task || null;
            renderStep('task', tasksFor(data));
            return;
        }

        if (previousStep === 'details') {
            selectedOption = null;
            renderStep('details', detailsFor(data)[answers.task]);
        }
    }


    // ------------------------------------------
    // Подготовка письма: русские подписи вместо кодов
    // ------------------------------------------

    function buildReadableAnswers(data) {
        const result = {};

        const typeOption = data.clientType.options.find(o => o.value === clientType);
        result['Кто обращается'] = typeOption ? typeOption.label : clientType;

        const taskOption = tasksFor(data).options.find(o => o.value === answers.task);
        result['Задача'] = taskOption ? taskOption.label.replace(/^📌\s*/, '') : answers.task;

        const detail = detailsFor(data)[answers.task];
        const fieldGroups = [];

        if (detail && Array.isArray(detail.fields)) {
            fieldGroups.push(detail.fields);
        }
        fieldGroups.push(data.contacts.fields);

        fieldGroups.forEach(fields => {
            fields.forEach(field => {
                let value = answers[field.name];

                if (Array.isArray(value)) {
                    value = value.join(', ');
                }

                if (value) {
                    result[field.label.replace(/\s*Можно выбрать несколько$/, '').replace(/\?$/, '')] = value;
                }
            });
        });

        return result;
    }


    // ------------------------------------------
    // Отправка
    // ------------------------------------------

    function submitQuiz() {
        if (!validateForm()) {
            return;
        }

        const consent = document.getElementById('consent');

        if (!consent || !consent.checked) {
            showMessage('Отметьте согласие на обработку персональных данных.');
            return;
        }

        const data = getQuizData();
        const botcheck = getContainer().querySelector('input[name="botcheck"]');
        const nextBtn = document.getElementById('next-btn');

        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.textContent = 'Отправляем…';
        }

        const consentTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

        const payload = Object.assign(
            {
                access_key: WEB3FORMS_KEY,
                subject: `Новая заявка с сайта Walker Legal — ${answers.name || 'без имени'}`,
                from_name: 'Walker Legal',
                replyto: answers.email,
                botcheck: botcheck ? botcheck.checked : false
            },
            buildReadableAnswers(data),
            {
                'Согласие на обработку ПД': `дано ${consentTime} (МСК), ${CONSENT_VERSION}`,
                'Страница': window.location.href
            }
        );

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json().catch(() => ({ success: false })))
            .then(result => {
                if (result.success) {
                    showSuccessScreen();
                } else {
                    failSubmit(`Заявка не отправилась. Попробуйте ещё раз или напишите на ${CONTACT_EMAIL}.`);
                }
            })
            .catch(() => {
                failSubmit(`Нет соединения с сервером. Проверьте интернет и нажмите «Отправить заявку» ещё раз или напишите на ${CONTACT_EMAIL}.`);
            });

        function failSubmit(text) {
            showMessage(text);

            if (nextBtn) {
                nextBtn.textContent = 'Отправить заявку';
                updateSubmitButton();
            }
        }
    }

    function showSuccessScreen() {
        const container = getContainer();

        if (!container) {
            return;
        }

        const step = document.createElement('div');
        step.className = 'quiz-step active';
        step.innerHTML = `
            <h2 tabindex="-1">Заявка отправлена</h2>
            <p>Мы изучим информацию и свяжемся с вами, чтобы уточнить задачу.</p>
            <button type="button" class="btn btn-primary" id="restart-quiz-btn">Заполнить анкету заново</button>
        `;

        container.innerHTML = '';
        container.appendChild(step);
        step.querySelector('h2').focus();

        updateProgress('done');

        document.getElementById('restart-quiz-btn').addEventListener('click', resetQuiz);
    }

    function resetQuiz() {
        clientType = null;
        answers = {};
        stepHistory = [];
        currentStepName = null;
        selectedOption = null;

        const data = getQuizData();

        if (data) {
            renderStep('clientType', data.clientType);
        }
    }

    function updateProgress(stepName) {
        const bar = document.getElementById('progress-bar');

        if (!bar) {
            return;
        }

        const percent = STEP_PROGRESS[stepName] ?? 0;
        bar.style.width = `${percent}%`;

        const wrapper = bar.parentElement;
        if (wrapper) {
            wrapper.setAttribute('aria-valuenow', String(percent));
        }
    }

    function initQuiz() {
        // Анкета есть только на services.html — на других страницах просто выходим
        if (!getContainer()) {
            return;
        }

        const data = getQuizData();

        if (!data) {
            console.error('[Walker Legal] quizData не найден.');
            return;
        }

        renderStep('clientType', data.clientType, false);
    }


    // ==========================================
    // ЗАПУСК
    // ==========================================

    function init() {
        initNav();
        initPackages();
        initQuiz();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
