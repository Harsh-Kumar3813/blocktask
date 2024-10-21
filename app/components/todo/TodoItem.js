import styles from '../../styles/Todo.module.css';
import { CalendarDaysIcon, TrashIcon } from '@heroicons/react/24/outline'; // Correct import for CalendarDaysIcon
import { CalendarIcon } from '@heroicons/react/24/outline'; // Import missing CalendarIcon

const TodoItem = ({ idx, content, marked, dateline, action, remove }) => {
    const handleMarkTodo = () => {
        if (marked) return;
        action(idx); // Marking/unmarking logic
    };

    const handleRemoveTodo = () => {
        remove(idx); // Call the remove function
    };

    return (
        <li key={idx} className={styles.todoItem}>
            <div onClick={handleMarkTodo} className={`${styles.todoCheckbox} ${marked && styles.checked}`} />
            <div>
                <span className="todoText">{content}</span>
                {dateline && (
                    <div className={styles.todoDateline}>
                        <CalendarIcon className={styles.calendarIcon} /> {/* Use correct CalendarIcon */}
                        <span>{dateline}</span>
                    </div>
                )}
            </div>
            <div className={styles.iconContainer}>
                <TrashIcon onClick={handleRemoveTodo} className={styles.trashIcon} /> {/* Trigger removal on click */}
            </div>
        </li>
    );
};

export default TodoItem;
