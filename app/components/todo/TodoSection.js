import TodoItem from './TodoItem';
import styles from '../../styles/Todo.module.css';

const TodoSection = ({ title, todos, action, remove }) => {
    return (
        <section className={styles.todoSection}>
            <h2>{title}</h2>
            <ul>
                {todos.map((todo) => (
                    <TodoItem
                        key={todo.account.idx}
                        idx={todo.account.idx}
                        content={todo.account.content}
                        marked={todo.account.marked}
                        dateline={todo.account.dateline}
                        action={action}   // Mark/unmark functionality
                        remove={remove}   // Removal functionality for both sections
                    />
                ))}
            </ul>
        </section>
    );
};

export default TodoSection;
