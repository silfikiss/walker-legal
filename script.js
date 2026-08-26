// ===== Walker Legal — логика анкеты =====
// Данные анкеты находятся в quiz-data.js

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

    const STEP_ORDER = [
        'clientType',
        'task',
        'details',
        'contacts'
    ];

    const STEP_PROGRESS = {
        clientType: 10,
        task: 35,
        details: 65,
        contacts: 90,
        done: 100
    };


    // ==========================================
    // ДАННЫЕ
    // ==========================================

    function getQuizData() {
        if (!window.quizData) {
            console.error(
                '[Walker Legal] quizData не загружен.'
            );

            return null;
        }

        return window.quizData;
    }


    // ==========================================
    // БЕЗОПАСНЫЙ HTML
    // ==========================================

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // ==========================================
    // ПРОВЕРКА ДАННЫХ
    // ==========================================

    function validateQuizData(data) {
        const errors = [];

        if (!data.clientType) {
            errors.push('Отсутствует clientType');
        }

        if (!data.businessTasks) {
            errors.push('Отсутствует businessTasks');
        }

        if (!data.individualTasks) {
            errors.push('Отсутствует individualTasks');
        }

        if (!data.businessDetails) {
            errors.push('Отсутствует businessDetails');
        }

        if (!data.individualDetails) {
            errors.push('Отсутствует individualDetails');
        }

        if (!data.contacts) {
            errors.push('Отсутствует contacts');
        }

        ['business', 'individual'].forEach(type => {
            const tasks =
                type === 'business'
                    ? data.businessTasks
                    : data.individualTasks;

            const details =
                type === 'business'
                    ? data.businessDetails
                    : data.individualDetails;

            if (!tasks || !tasks.options || !details) {
                return;
            }

            tasks.options.forEach(option => {
                if (!details[option.value]) {
                    console.warn(
                        `[Walker Legal] Для ${type} → ${option.value} ` +
                        'не найден блок details.'
                    );
                }
            });
        });

        if (errors.length) {
            console.error(
                '[Walker Legal] Ошибки структуры quizData:',
                errors
            );

            return false;
        }

        return true;
    }


    // ==========================================
    // КОНТЕЙНЕР
    // ==========================================

    function getContainer() {
        return document.getElementById('quiz-container');
    }


    // ==========================================
    // ИСТОРИЯ
    // ==========================================

    function canGoBack() {
        return stepHistory.length > 0;
    }


    function rememberStep(stepName) {
        stepHistory.push(stepName);
    }


    // ==========================================
    // HTML КНОПКИ «НАЗАД»
    // ==========================================

    function getBackButtonHtml() {
        if (!canGoBack()) {
            return '';
        }

        return `
            <div class="form-actions">
                <button
                    type="button"
                    class="btn btn-secondary quiz-back-button"
                >
                    ← Назад
                </button>
            </div>
        `;
    }


    // ==========================================
    // РЕНДЕРИНГ ШАГА
    // ==========================================

    function renderStep(stepName, data) {
        const container = getContainer();

        if (!container) {
            console.error(
                '[Walker Legal] Не найден #quiz-container'
            );

            return;
        }

        if (!data) {
            console.error(
                `[Walker Legal] Нет данных для шага "${stepName}"`
            );

            return;
        }

        currentStepName = stepName;

        const stepDiv = document.createElement('div');

        stepDiv.className = 'quiz-step';

        let html = '';


        // ------------------------------------------
        // Заголовок
        // ------------------------------------------

        if (data.question) {
            html += `
                <h2>
                    ${escapeHtml(data.question)}
                </h2>
            `;
        }


        // ------------------------------------------
        // Варианты ответа
        // ------------------------------------------

        if (Array.isArray(data.options)) {
    html += '<div class="quiz-buttons">';

    data.options.forEach(option => {
        let buttonClass = 'quiz-btn';

        if (option.isPackage) {
            buttonClass += ' package-btn';
        }

        if (selectedOption === option.value) {
            buttonClass += ' selected';
        }

        html += `
            <button
                type="button"
                class="${buttonClass}"
                data-step="${escapeHtml(stepName)}"
                data-value="${escapeHtml(option.value)}"
            >
                ${escapeHtml(option.label)}
            </button>
        `;
    });

    html += '</div>';

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
                ${selectedOption === null ? 'disabled' : ''}
            >
                Далее
            </button>
        </div>
    `;
}

        // ------------------------------------------
        // Поля формы
        // ------------------------------------------

        if (Array.isArray(data.fields)) {

            html += `
                <div class="quiz-form">
            `;

            data.fields.forEach(field => {

                const fieldId =
                    `field-${field.name}`;

                const requiredAttr =
                    field.required
                        ? ' required'
                        : '';

                const requiredMark =
                    field.required
                        ? ' <span class="required-star">*</span>'
                        : '';

                const savedValue =
                    answers[field.name] !== undefined
                        ? answers[field.name]
                        : '';

                const placeholder =
                    field.placeholder || field.label;


                html += `
                    <div class="quiz-field">

                        <label for="${escapeHtml(fieldId)}">
                            ${escapeHtml(field.label)}
                            ${requiredMark}
                        </label>
                `;


                // TEXTAREA

                if (field.type === 'textarea') {

                    html += `
                        <textarea
                            id="${escapeHtml(fieldId)}"
                            name="${escapeHtml(field.name)}"
                            placeholder="${escapeHtml(placeholder)}"
                            ${requiredAttr}
                        >${escapeHtml(savedValue)}</textarea>
                    `;
                }


                // SELECT

                else if (field.type === 'select') {

                    html += `
                        <select
                            id="${escapeHtml(fieldId)}"
                            name="${escapeHtml(field.name)}"
                            ${requiredAttr}
                        >
                            <option
                                value=""
                                disabled
                                ${!savedValue ? 'selected' : ''}
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
                                        String(savedValue) === String(option)
                                            ? 'selected'
                                            : ''
                                    }
                                >
                                    ${escapeHtml(option)}
                                </option>
                            `;
                        });
                    }

                    html += '</select>';
                }


                // INPUT

                else {

                    html += `
                        <input
                            type="${escapeHtml(field.type || 'text')}"
                            id="${escapeHtml(fieldId)}"
                            name="${escapeHtml(field.name)}"
                            placeholder="${escapeHtml(placeholder)}"
                            value="${escapeHtml(savedValue)}"
                            ${requiredAttr}
                        >
                    `;
                }

                html += `
                    </div>
                `;
            });


            // --------------------------------------
            // Согласие
            // --------------------------------------

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


            // --------------------------------------
            // Кнопки формы
            // --------------------------------------

            const isContacts =
                stepName === 'contacts';

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
                        ${isContacts ? 'disabled' : ''}
                    >
                        ${isContacts ? 'Отправить' : 'Далее'}
                    </button>

                </div>
            `;

            html += `
                </div>
            `;
        }


        // ------------------------------------------
        // Вставка HTML
        // ------------------------------------------

        stepDiv.innerHTML = html;

        container.innerHTML = '';

        container.appendChild(stepDiv);


        // ------------------------------------------
        // Обработчики
        // ------------------------------------------

        bindStepEvents(stepName);


        // ------------------------------------------
        // Анимация
        // ------------------------------------------

        requestAnimationFrame(() => {
            stepDiv.classList.add('active');
        });


        // ------------------------------------------
        // Прогресс
        // ------------------------------------------

        updateProgress(stepName);
    }


    // ==========================================
    // СОБЫТИЯ ШАГА
    // ==========================================

    function bindStepEvents(stepName) {

        const container = getContainer();

        if (!container) {
            return;
        }


        // ------------------------------------------
        // Варианты ответа
        // ------------------------------------------

        container
            .querySelectorAll('.quiz-btn')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const step =
                            button.dataset.step;

                        const value =
                            button.dataset.value;

                        handleOptionClick(
                            step,
                            value
                        );
                    }
                );
            });


        // ------------------------------------------
        // Кнопки «Назад»
        // ------------------------------------------

        container
            .querySelectorAll('.quiz-back-button')
            .forEach(button => {

                button.addEventListener(
                    'click',
                    goBack
                );
            });


        // ------------------------------------------
        // Поля
        // ------------------------------------------

        container
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

                        saveCurrentField(field);
                    }
                );


                field.addEventListener(
                    'change',
                    () => {

                        field.classList.remove(
                            'error'
                        );

                        saveCurrentField(field);

                        if (field.id === 'consent') {
                            toggleSubmit();
                        }
                    }
                );


                field.addEventListener(
                    'blur',
                    () => {

                        validateField(field);
                    }
                );
            });


        // ------------------------------------------
        // Далее / Отправить
        // ------------------------------------------

        const nextButton =
            document.getElementById('next-btn');

        if (!nextButton) {
            return;
        }

        if (stepName === 'contacts') {

            nextButton.addEventListener(
                'click',
                submitQuiz
            );

        } else {

            nextButton.addEventListener(
                'click',
                handleFormNext
            );
        }
    }


    // ==========================================
    // СОХРАНЕНИЕ ПОЛЯ
    // ==========================================

    function saveCurrentField(field) {

        if (!field || !field.id) {
            return;
        }

        if (field.id === 'consent') {
            return;
        }

        if (!field.id.startsWith('field-')) {
            return;
        }

        const key =
            field.id.replace('field-', '');

        answers[key] = field.value;
    }


    // ==========================================
    // ВАЛИДАЦИЯ ПОЛЯ
    // ==========================================

    function validateField(field) {

        if (!field.hasAttribute('required')) {

            field.classList.remove('error');

            return true;
        }

        const value =
            String(field.value || '').trim();

        if (!value) {

            field.classList.add('error');

            return false;
        }

        field.classList.remove('error');

        return true;
    }


    // ==========================================
    // ВАЛИДАЦИЯ ФОРМЫ
    // ==========================================

    function validateCurrentForm() {

        const container = getContainer();

        if (!container) {
            return false;
        }

        let isValid = true;

        container
            .querySelectorAll(
                'input, select, textarea'
            )
            .forEach(field => {

                if (field.id === 'consent') {
                    return;
                }

                saveCurrentField(field);

                if (!validateField(field)) {
                    isValid = false;
                }
            });

        return isValid;
    }


    // ==========================================
    // ВЫБОР ВАРИАНТА
    // ==========================================

    function handleOptionClick(stepName, value) {

        const data = getQuizData();

        if (!data) {
            return;
        }


        // ------------------------------------------
        // Кто обращается
        // ------------------------------------------

        if (stepName === 'clientType') {

            clientType = value;

            answers = {
                clientType: value
            };

            // В историю записываем шаг,
            // с которого пришли.
            stepHistory = [
                'clientType'
            ];

            const tasks =
                value === 'business'
                    ? data.businessTasks
                    : data.individualTasks;

            renderStep(
                'task',
                tasks
            );

            return;
        }


        // ------------------------------------------
        // Выбор задачи
        // ------------------------------------------

        if (stepName === 'task') {

            const details =
                clientType === 'business'
                    ? data.businessDetails
                    : data.individualDetails;


            // Удаляем ответы старой ветки
            clearPreviousDetailAnswers();


            answers.task = value;


            // В историю записываем task
            stepHistory.push('task');


            const detail =
                details[value];


            if (detail) {

                renderStep(
                    'details',
                    detail
                );

            } else {

                console.warn(
                    `[Walker Legal] Для задачи "${value}" ` +
                    'нет блока уточняющих вопросов.'
                );

                stepHistory.push(
                    'details'
                );

                renderStep(
                    'contacts',
                    data.contacts
                );
            }

            return;
        }
    }


    // ==========================================
    // ОЧИСТКА СТАРЫХ ОТВЕТОВ
    // ==========================================

    function clearPreviousDetailAnswers() {

        const data = getQuizData();

        if (
            !data ||
            !answers.task ||
            !clientType
        ) {
            return;
        }

        const details =
            clientType === 'business'
                ? data.businessDetails
                : data.individualDetails;

        const previousDetail =
            details[answers.task];

        if (
            !previousDetail ||
            !Array.isArray(previousDetail.fields)
        ) {
            return;
        }

        previousDetail.fields.forEach(
            field => {
                delete answers[field.name];
            }
        );
    }


    // ==========================================
    // КНОПКА «ДАЛЕЕ»
    // ==========================================

    function handleFormNext() {

        if (!validateCurrentForm()) {
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
    // КНОПКА «НАЗАД»
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


        // ------------------------------------------
        // Возвращаемся к «Кто обращается?»
        // ------------------------------------------

        if (
            previousStep === 'clientType'
        ) {

            clientType = null;

            answers = {};

            renderStep(
                'clientType',
                data.clientType
            );

            return;
        }


        // ------------------------------------------
        // Возвращаемся к выбору задачи
        // ------------------------------------------

        if (
            previousStep === 'task'
        ) {

            const tasks =
                clientType === 'business'
                    ? data.businessTasks
                    : data.individualTasks;

            renderStep(
                'task',
                tasks
            );

            return;
        }


        // ------------------------------------------
        // Возвращаемся к деталям
        // ------------------------------------------

        if (
            previousStep === 'details'
        ) {

            const details =
                clientType === 'business'
                    ? data.businessDetails
                    : data.individualDetails;

            const detail =
                details[answers.task];

            if (detail) {

                renderStep(
                    'details',
                    detail
                );

            } else {

                goBack();
            }
        }
    }


    // ==========================================
    // СОГЛАСИЕ
    // ==========================================

    function toggleSubmit() {

        const consent =
            document.getElementById(
                'consent'
            );

        const button =
            document.getElementById(
                'next-btn'
            );

        if (!consent || !button) {
            return;
        }

        button.disabled =
            !consent.checked;
    }


    // ==========================================
    // ОТПРАВКА
    // ==========================================

    function submitQuiz() {

        if (!validateCurrentForm()) {
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

            if (consent) {
                consent.classList.add(
                    'error'
                );
            }

            return;
        }


        console.log(
            '[Walker Legal] Анкета отправлена:',
            JSON.stringify(
                answers,
                null,
                2
            )
        );


        showSuccessScreen();
    }


    // ==========================================
    // ФИНАЛЬНЫЙ ЭКРАН
    // ==========================================

    function showSuccessScreen() {

        const container =
            getContainer();

        if (!container) {
            return;
        }

        const stepDiv =
            document.createElement(
                'div'
            );

        stepDiv.className =
            'quiz-step active';

        stepDiv.innerHTML = `
            <h2>Спасибо!</h2>

            <p>
                Запрос получен. Мы изучим ответы
                и свяжемся с вами, чтобы уточнить
                задачу и предложить подходящий
                формат работы.
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

        container.appendChild(
            stepDiv
        );


        const restartButton =
            document.getElementById(
                'restart-quiz-btn'
            );

        if (restartButton) {

            restartButton.addEventListener(
                'click',
                resetQuiz
            );
        }

        updateProgress('done');
    }


    // ==========================================
    // СБРОС
    // ==========================================

    function resetQuiz() {

        clientType = null;

        answers = {};

        stepHistory = [];

        currentStepName = null;


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
            STEP_PROGRESS[stepName] !== undefined
                ? STEP_PROGRESS[stepName]
                : 0;

        bar.style.width =
            `${percent}%`;


        let label =
            document.getElementById(
                'progress-label'
            );

        const progress =
            document.querySelector(
                '.progress'
            );


        if (!label && progress) {

            label =
                document.createElement(
                    'div'
                );

            label.id =
                'progress-label';

            label.className =
                'progress-label';

            progress.parentNode.insertBefore(
                label,
                progress
            );
        }


        if (!label) {
            return;
        }


        if (stepName === 'done') {

            label.textContent =
                'Готово!';

            return;
        }


        const stepIndex =
            STEP_ORDER.indexOf(
                stepName
            );


        if (stepIndex === -1) {

            label.textContent = '';

            return;
        }


        label.textContent =
            `Шаг ${stepIndex + 1} из ${STEP_ORDER.length}`;
    }


    // ==========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ==========================================

    function initQuiz() {

        const data =
            getQuizData();

        if (!data) {
            return;
        }


        if (!validateQuizData(data)) {

            console.error(
                '[Walker Legal] Анкета содержит ошибки.'
            );
        }


        const progress =
            document.querySelector(
                '.progress'
            );


        if (progress) {

            let label =
                document.getElementById(
                    'progress-label'
                );


            if (!label) {

                label =
                    document.createElement(
                        'div'
                    );

                label.id =
                    'progress-label';

                label.className =
                    'progress-label';

                progress.parentNode.insertBefore(
                    label,
                    progress
                );
            }
        }


        renderStep(
            'clientType',
            data.clientType
        );
    }


    // ==========================================
    // ЗАПУСК
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
