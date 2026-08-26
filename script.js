// ==========================================
// WALKER LEGAL — АНКЕТА
// ==========================================

(function () {
    'use strict';

    // ==========================================
    // СОСТОЯНИЕ
    // ==========================================

    let clientType = null;
    let answers = {};
    let stepHistory = [];
    let currentStepName = null;
    let selectedOption = null;


    // ==========================================
    // НАСТРОЙКИ ПРОГРЕССА
    // ==========================================

    const STEP_PROGRESS = {
        clientType: 0,
        task: 33,
        details: 66,
        contacts: 90,
        done: 100
    };


    // ==========================================
    // ПОЛУЧЕНИЕ ДАННЫХ
    // ==========================================

    function getQuizData() {
        return window.quizData || null;
    }


    // ==========================================
    // КОНТЕЙНЕР АНКЕТЫ
    // ==========================================

    function getContainer() {
        return document.getElementById('quiz-container');
    }


    // ==========================================
    // ЭКРАНИРОВАНИЕ HTML
    // ==========================================

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // ==========================================
    // МОЖНО ЛИ НАЗАД
    // ==========================================

    function canGoBack() {
        return stepHistory.length > 0;
    }


    // ==========================================
    // СОХРАНЕНИЕ ПОЛЯ
    // ==========================================

    function saveField(field) {
        if (!field || field.id === 'consent') {
            return;
        }

        if (!field.name) {
            return;
        }

        answers[field.name] = field.value;
    }


    // ==========================================
    // ВАЛИДАЦИЯ ФОРМЫ
    // ==========================================

    function validateForm() {
        const container = getContainer();

        if (!container) {
            return false;
        }

        let valid = true;

        container
            .querySelectorAll(
                'input:not([type="checkbox"]), select, textarea'
            )
            .forEach(field => {
                saveField(field);

                if (
                    field.required &&
                    !String(field.value).trim()
                ) {
                    field.classList.add('error');
                    valid = false;
                } else {
                    field.classList.remove('error');
                }
            });

        return valid;
    }


    // ==========================================
    // РЕНДЕРИНГ ШАГА
    // ==========================================

    function renderStep(stepName, data) {
        const container = getContainer();

        if (!container || !data) {
            return;
        }

        currentStepName = stepName;

        const step = document.createElement('div');

        step.className = 'quiz-step';

        let html = '';

        // Заголовок
        if (data.question) {
            html += `
                <h2>${escapeHtml(data.question)}</h2>
            `;
        }


        // ======================================
        // ВАРИАНТЫ
        // ======================================

        if (Array.isArray(data.options)) {

            html += `
                <div class="quiz-buttons">
            `;

            data.options.forEach(option => {

                let className = 'quiz-btn';

                if (option.isPackage) {
                    className += ' package-btn';
                }

                if (
                    selectedOption !== null &&
                    String(selectedOption) === String(option.value)
                ) {
                    className += ' selected';
                }

                html += `
                    <button
                        type="button"
                        class="${className}"
                        data-value="${escapeHtml(option.value)}"
                    >
                        ${escapeHtml(option.label)}
                    </button>
                `;
            });

            html += `
                </div>

                <div class="form-actions">
            `;

            if (canGoBack()) {
                html += `
                    <button
                        type="button"
                        class="btn btn-secondary quiz-back-button"
                    >
                        ← Назад
                    </button>
                `;
            }

            html += `
                    <button
                        type="button"
                        class="btn btn-primary"
                        id="next-btn"
                        ${selectedOption === null ? 'disabled' : ''}
                    >
                        Далее
                    </button>
                </div>
            `;
        }


        // ======================================
        // ПОЛЯ
        // ======================================

        if (Array.isArray(data.fields)) {

            html += `
                <div class="quiz-form">
            `;

            data.fields.forEach(field => {

                const value =
                    answers[field.name] ?? '';

                const required =
                    field.required ? 'required' : '';

                const requiredMark =
                    field.required
                        ? ' <span class="required-star">*</span>'
                        : '';

                html += `
                    <div class="quiz-field">
                        <label
                            for="field-${escapeHtml(field.name)}"
                        >
                            ${escapeHtml(field.label)}
                            ${requiredMark}
                        </label>
                `;


                // TEXTAREA
                if (field.type === 'textarea') {

                    html += `
                        <textarea
                            id="field-${escapeHtml(field.name)}"
                            name="${escapeHtml(field.name)}"
                            placeholder="${escapeHtml(field.placeholder || '')}"
                            ${required}
                        >${escapeHtml(value)}</textarea>
                    `;
                }


                // SELECT
                else if (field.type === 'select') {

                    html += `
                        <select
                            id="field-${escapeHtml(field.name)}"
                            name="${escapeHtml(field.name)}"
                            ${required}
                        >
                            <option
                                value=""
                                disabled
                                ${value === '' ? 'selected' : ''}
                            >
                                Выберите вариант
                            </option>
                    `;

                    if (Array.isArray(field.options)) {

                        field.options.forEach(option => {

                            html += `
                                <option
                                    value="${escapeHtml(option)}"
                                    ${
                                        String(value) === String(option)
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    ${escapeHtml(option)}
                                </option>
                            `;
                        });
                    }

                    html += `
                        </select>
                    `;
                }


                // INPUT
                else {

                    html += `
                        <input
                            type="${escapeHtml(field.type || 'text')}"
                            id="field-${escapeHtml(field.name)}"
                            name="${escapeHtml(field.name)}"
                            value="${escapeHtml(value)}"
                            placeholder="${escapeHtml(field.placeholder || '')}"
                            ${required}
                        >
                    `;
                }

                html += `
                    </div>
                `;
            });


            // ==================================
            // СОГЛАСИЕ
            // ==================================

            if (stepName === 'contacts') {

                html += `
                    <label class="consent-label">
                        <input
                            type="checkbox"
                            id="consent"
                        >

                        <span>
                            Согласен на обработку персональных данных
                        </span>
                    </label>
                `;
            }


            // ==================================
            // КНОПКИ
            // ==================================

            html += `
                <div class="form-actions">
            `;

            if (canGoBack()) {
                html += `
                    <button
                        type="button"
                        class="btn btn-secondary quiz-back-button"
                    >
                        ← Назад
                    </button>
                `;
            }

            html += `
                    <button
                        type="button"
                        class="btn btn-primary"
                        id="next-btn"
                        ${
                            stepName === 'contacts'
                                ? 'disabled'
                                : ''
                        }
                    >
                        ${
                            stepName === 'contacts'
                                ? 'Отправить'
                                : 'Далее'
                        }
                    </button>
                </div>
            `;

            html += `
                </div>
            `;
        }


        // ======================================
        // ВСТАВКА
        // ======================================

        step.innerHTML = html;

        container.innerHTML = '';

        container.appendChild(step);

        requestAnimationFrame(() => {
            step.classList.add('active');
        });


        // ======================================
        // СОБЫТИЯ
        // ======================================

        bindEvents(step, stepName, data);

        updateProgress(stepName);
    }


    // ==========================================
    // СОБЫТИЯ
    // ==========================================

    function bindEvents(step, stepName, data) {

        // --------------------------------------
        // ВЫБОР ВАРИАНТА
        // --------------------------------------

        step
            .querySelectorAll('.quiz-btn')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        selectedOption =
                            button.dataset.value;

                        step
                            .querySelectorAll('.quiz-btn')
                            .forEach(item => {
                                item.classList.remove(
                                    'selected'
                                );
                            });

                        button.classList.add(
                            'selected'
                        );

                        const next =
                            step.querySelector(
                                '#next-btn'
                            );

                        if (next) {
                            next.disabled = false;
                        }
                    }
                );
            });


        // --------------------------------------
        // НАЗАД
        // --------------------------------------

        step
            .querySelectorAll('.quiz-back-button')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    goBack
                );
            });


        // --------------------------------------
        // ПОЛЯ
        // --------------------------------------

        step
            .querySelectorAll(
                'input, select, textarea'
            )
            .forEach(field => {

                field.addEventListener(
                    'input',
                    () => {
                        field.classList.remove(
                            'error'
                        );

                        saveField(field);

                        updateSubmitButton();
                    }
                );


                field.addEventListener(
                    'change',
                    () => {
                        field.classList.remove(
                            'error'
                        );

                        saveField(field);

                        updateSubmitButton();
                    }
                );
            });


        // --------------------------------------
        // ДАЛЕЕ
        // --------------------------------------

        const next =
            step.querySelector('#next-btn');

        if (!next) {
            return;
        }


        if (stepName === 'contacts') {

            next.addEventListener(
                'click',
                submitQuiz
            );

            updateSubmitButton();

        } else if (
            Array.isArray(data.options)
        ) {

            next.addEventListener(
                'click',
                handleOptionNext
            );

        } else {

            next.addEventListener(
                'click',
                handleFormNext
            );
        }
    }


    // ==========================================
    // АКТИВНА ЛИ ОТПРАВКА
    // ==========================================

    function updateSubmitButton() {

        const consent =
            document.getElementById(
                'consent'
            );

        const next =
            document.getElementById(
                'next-btn'
            );

        if (!consent || !next) {
            return;
        }

        next.disabled =
            !consent.checked;
    }


    // ==========================================
    // ДАЛЕЕ ДЛЯ ВАРИАНТОВ
    // ==========================================

    function handleOptionNext() {

        const data = getQuizData();

        if (
            !data ||
            selectedOption === null
        ) {
            return;
        }


        // --------------------------------------
        // КТО ОБРАЩАЕТСЯ
        // --------------------------------------

        if (
            currentStepName === 'clientType'
        ) {

            clientType =
                selectedOption;

            answers = {
                clientType
            };

            stepHistory = [
                'clientType'
            ];

            const tasks =
                clientType === 'business'
                    ? data.businessTasks
                    : data.individualTasks;

            selectedOption = null;

            renderStep(
                'task',
                tasks
            );

            return;
        }


        // --------------------------------------
        // ОСНОВНАЯ ЗАДАЧА
        // --------------------------------------

        if (
            currentStepName === 'task'
        ) {

            const task =
                selectedOption;

            const details =
                clientType === 'business'
                    ? data.businessDetails
                    : data.individualDetails;

            answers.task = task;

            stepHistory.push(
                'task'
            );

            const detail =
                details[task];

            selectedOption = null;

            if (detail) {

                renderStep(
                    'details',
                    detail
                );

            } else {

                stepHistory.push(
                    'details'
                );

                renderStep(
                    'contacts',
                    data.contacts
                );
            }
        }
    }


    // ==========================================
    // ДАЛЕЕ ДЛЯ ПОЛЕЙ
    // ==========================================

    function handleFormNext() {

        if (!validateForm()) {
            return;
        }

        const data = getQuizData();

        if (!data) {
            return;
        }

        stepHistory.push(
            'details'
        );

        renderStep(
            'contacts',
            data.contacts
        );
    }


    // ==========================================
    // НАЗАД
    // ==========================================

    function goBack() {

        const data = getQuizData();

        if (
            !data ||
            stepHistory.length === 0
        ) {
            return;
        }

        const previousStep =
            stepHistory.pop();


        // --------------------------------------
        // К КТО ОБРАЩАЕТСЯ
        // --------------------------------------

        if (
            previousStep === 'clientType'
        ) {

            clientType = null;
            answers = {};
            selectedOption = null;

            renderStep(
                'clientType',
                data.clientType
            );

            return;
        }


        // --------------------------------------
        // К ВЫБОРУ ЗАДАЧИ
        // --------------------------------------

        if (
            previousStep === 'task'
        ) {

            const tasks =
                clientType === 'business'
                    ? data.businessTasks
                    : data.individualTasks;

            selectedOption =
                answers.task || null;

            renderStep(
                'task',
                tasks
            );

            return;
        }


        // --------------------------------------
        // К УТОЧНЕНИЯМ
        // --------------------------------------

        if (
            previousStep === 'details'
        ) {

            const details =
                clientType === 'business'
                    ? data.businessDetails
                    : data.individualDetails;

            const detail =
                details[answers.task];

            selectedOption = null;

            if (detail) {
                renderStep(
                    'details',
                    detail
                );
            }
        }
    }


    // ==========================================
    // ОТПРАВКА
    // ==========================================

    function submitQuiz() {

        if (!validateForm()) {
            return;
        }

        const consent =
            document.getElementById(
                'consent'
            );

        if (
            !consent ||
            !consent.checked
        ) {
            return;
        }


        console.log(
            '[Walker Legal] Ответы анкеты:',
            answers
        );


        showSuccessScreen();
    }


    // ==========================================
    // СПАСИБО
    // ==========================================

    function showSuccessScreen() {

        const container =
            getContainer();

        if (!container) {
            return;
        }

        const step =
            document.createElement(
                'div'
            );

        step.className =
            'quiz-step active';

        step.innerHTML = `
            <h2>Спасибо!</h2>

            <p>
                Мы получили ваш запрос.
                Изучим информацию и свяжемся
                с вами для уточнения задачи.
            </p>

            <button
                type="button"
                class="btn btn-primary"
                id="restart-quiz-btn"
            >
                Заполнить заново
            </button>
        `;

        container.innerHTML = '';

        container.appendChild(step);

        updateProgress('done');


        const restart =
            document.getElementById(
                'restart-quiz-btn'
            );

        if (restart) {

            restart.addEventListener(
                'click',
                resetQuiz
            );
        }
    }


    // ==========================================
    // СБРОС
    // ==========================================

    function resetQuiz() {

        clientType = null;
        answers = {};
        stepHistory = [];
        currentStepName = null;
        selectedOption = null;

        const data =
            getQuizData();

        if (!data) {
            return;
        }

        renderStep(
            'clientType',
            data.clientType
        );
    }


    // ==========================================
    // ПРОГРЕСС
    // ==========================================

    function updateProgress(stepName) {

        const bar =
            document.getElementById(
                'progress-bar'
            );

        if (!bar) {
            return;
        }

        const percent =
            STEP_PROGRESS[stepName] ?? 0;

        bar.style.width =
            `${percent}%`;
    }


    // ==========================================
    // ЗАПУСК
    // ==========================================

    function initQuiz() {

        const data =
            getQuizData();

        if (!data) {

            console.error(
                '[Walker Legal] quizData не найден.'
            );

            return;
        }

        const container =
            getContainer();

        if (!container) {

            console.error(
                '[Walker Legal] #quiz-container не найден.'
            );

            return;
        }

        renderStep(
            'clientType',
            data.clientType
        );
    }


    // ==========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ==========================================

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initQuiz
        );

    } else {

        initQuiz();
    }

})();
