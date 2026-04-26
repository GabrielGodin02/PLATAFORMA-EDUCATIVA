import { calculateAverage, calculateFinalGrade } from './gradeCalculations';

// Calcula el promedio general de un estudiante en todas sus materias
export const calculateStudentAverage = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;

    const subjectAverages = subjects.map(subject => {
        let totalFinal = 0;
        let periodCount = 0;

        Object.values(subject.years || {}).forEach(periods => {
            Object.values(periods).forEach(grades => {
                const taskAvg = calculateAverage(grades.tasks);
                const examAvg = calculateAverage(grades.exams);
                const presentationAvg = calculateAverage(grades.presentations);
                const final = calculateFinalGrade(taskAvg, examAvg, presentationAvg);
                if (parseFloat(final) > 0) {
                    totalFinal += parseFloat(final);
                    periodCount++;
                }
            });
        });

        return periodCount > 0 ? totalFinal / periodCount : 0;
    });

    const total = subjectAverages.reduce((a, b) => a + b, 0);
    return subjectAverages.length > 0 ? total / subjectAverages.length : 0;
};

// Calcula el promedio solo en materias prioritarias
export const calculatePriorityAverage = (subjects, prioritySubjects) => {
    if (!prioritySubjects || prioritySubjects.length === 0) return 0;

    const priority = subjects.filter(s =>
        prioritySubjects.map(p => p.toLowerCase()).includes(s.name.toLowerCase())
    );

    return calculateStudentAverage(priority);
};

// Calcula el ranking de todos los estudiantes
export const calculateRanking = (studentsWithSubjects, prioritySubjects) => {
    const withAverages = studentsWithSubjects.map(student => ({
        ...student,
        generalAvg: calculateStudentAverage(student.subjects),
        priorityAvg: calculatePriorityAverage(student.subjects, prioritySubjects),
    }));

    // Ordenar por promedio general, desempatar con prioritario
    withAverages.sort((a, b) => {
        if (b.generalAvg !== a.generalAvg) return b.generalAvg - a.generalAvg;
        return b.priorityAvg - a.priorityAvg;
    });

    // Asignar puestos con empates
    let ranking = 1;
    return withAverages.map((student, index) => {
        if (index > 0) {
            const prev = withAverages[index - 1];
            if (student.generalAvg !== prev.generalAvg || student.priorityAvg !== prev.priorityAvg) {
                ranking = index + 1;
            }
        }
        return { ...student, ranking };
    });
};