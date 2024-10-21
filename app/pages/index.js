import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTodo } from '../hooks/todo';
import Loading from '../components/Loading';
import TodoSection from '../components/todo/TodoSection';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const Home = () => {
    const { connected, publicKey } = useWallet();
    const {
        initialized,
        initializeUser,
        loading,
        transactionPending,
        todos,
        input,
        setInput,
        addTodo,
        markTodo,
        removeTodo,
    } = useTodo();

    const [clientInitialized, setClientInitialized] = useState(false);

    useEffect(() => {
        setClientInitialized(true);
    }, []);

    if (!clientInitialized) {
        return null;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (publicKey) {
            await addTodo(event);
        } else {
            console.error("Wallet not connected. Unable to add todo.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.actionsContainer}>
                <WalletMultiButton />
            </div>
            <div className={styles.todoInput}>
                {initialized ? (
                    <>
                        <h2>Create a new todo</h2> {/* Header for creating todos */}
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                id={styles.inputField}
                                type="text"
                                placeholder='Type your todo here...'
                            />
                            <button type="submit" className={styles.button} disabled={transactionPending}>
                                {transactionPending ? 'Adding...' : 'Add'}
                            </button>
                        </form>
                    </>
                ) : (
                    <button
                        type="button"
                        className={styles.button}
                        onClick={initializeUser}
                        disabled={transactionPending}
                    >
                        {transactionPending ? 'Initializing...' : 'Initialize'}
                    </button>
                )}
            </div>

            <div className={styles.mainContainer}>
                <Loading loading={loading}>
                    {/* Incomplete Todos */}
                    <TodoSection
                        title="Tasks"
                        todos={todos ? todos.filter(todo => !todo.account.marked) : []}
                        action={markTodo}
                        remove={removeTodo}
                    />
                    
                    {/* Completed Todos */}
                    <TodoSection
                        title="Completed"
                        todos={todos ? todos.filter(todo => todo.account.marked) : []}
                        action={markTodo}
                        remove={removeTodo}
                    />
                </Loading>
            </div>
        </div>
    );
};

export default Home;
