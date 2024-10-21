import * as anchor from '@project-serum/anchor';
import { useEffect, useMemo, useState } from 'react';
import { TODO_PROGRAM_PUBKEY } from '../constants/index';
import { IDL as profileIdl } from '../constants/idl';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { authorFilter } from '../utils/index';
import toast from 'react-hot-toast';

export function useTodo() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();

    const [initialized, setInitialized] = useState(false);
    const [lastTodo, setLastTodo] = useState(0);
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [transactionPending, setTransactionPending] = useState(false);
    const [input, setInput] = useState("");

    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions());
            return new anchor.Program(profileIdl, TODO_PROGRAM_PUBKEY, provider);
        }
    }, [connection, anchorWallet]);

    useEffect(() => {
        const findProfileAccounts = async () => {
            if (program && publicKey && !transactionPending) {
                try {
                    setLoading(true);
                    const [profilePda] = PublicKey.findProgramAddressSync(
                        [Buffer.from('USER_STATE'), publicKey.toBuffer()],
                        program.programId
                    );
                    const profileAccount = await program.account.userProfile.fetchNullable(profilePda);

                    if (profileAccount) {
                        setLastTodo(profileAccount.lastTodo);
                        setInitialized(true);

                        const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
                        setTodos(todoAccounts);
                    } else {
                        setInitialized(false);
                    }
                } catch (error) {
                    console.error('Error fetching profile accounts:', error);
                    setInitialized(false);
                    setTodos([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        findProfileAccounts();
    }, [publicKey, program, transactionPending]);

    const fetchTodos = async () => {
        try {
            if (program && publicKey) {
                const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
                return todoAccounts;
            }
            return [];
        } catch (error) {
            console.error('Error fetching todos:', error);
            return [];
        }
    };

    const initializeUser = async () => {
        if (program && publicKey) {
            try {
                const latestBlockhashInfo = await connection.getLatestBlockhash();
                const { blockhash } = latestBlockhashInfo;
    
                const [profilePda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('USER_STATE'), publicKey.toBuffer()],
                    program.programId
                );
    
                // Check if the userProfile is already initialized
                const userProfileAccount = await program.account.userProfile.fetchNullable(profilePda);
                if (userProfileAccount) {
                    console.log("UserProfile is already initialized.");
                    return profilePda;
                }
    
                console.log("Initializing userProfile...");
    
                const initTx = new anchor.web3.Transaction().add(
                    await program.methods.initializeUser().accounts({
                        userProfile: profilePda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId,
                    }).instruction()
                );
    
                initTx.recentBlockhash = blockhash;
                initTx.feePayer = publicKey;
    
                const txSig = await program.provider.sendAndConfirm(initTx);
                console.log('UserProfile initialized with signature:', txSig);
    
                return profilePda;
            } catch (error) {
                console.error('Error initializing userProfile:', error);
            }
        }
    };
    

    
const addTodo = async (e) => {
    // Ensure e exists, if not log a warning
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    } else {
        console.warn("No event object passed to addTodo function.");
        return;
    }

    if (program && publicKey) {
        try {
            setTransactionPending(true);

            const latestBlockhashInfo = await connection.getLatestBlockhash();
            const { blockhash } = latestBlockhashInfo;

            // Check if the user profile exists
            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('USER_STATE'), publicKey.toBuffer()],
                program.programId
            );

            let userProfile;
            try {
                userProfile = await program.account.userProfile.fetch(profilePda);
            } catch (error) {
                console.log("User profile not found, initializing...");

                // If not found, initialize the user profile
                const initTx = new anchor.web3.Transaction().add(
                    await program.methods.initializeUser().accounts({
                        userProfile: profilePda,
                        authority: publicKey,
                        systemProgram: SystemProgram.programId,
                    }).instruction()
                );

                initTx.recentBlockhash = blockhash;
                initTx.feePayer = publicKey;

                const initTxSig = await program.provider.sendAndConfirm(initTx);
                console.log('User profile initialized:', initTxSig);

                // Fetch the user profile again after initialization
                userProfile = await program.account.userProfile.fetch(profilePda);
            }

            const content = input.trim();
            if (!content) {
                setTransactionPending(false);
                return;
            }

            const lastTodo = userProfile.lastTodo;
            const [todoPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('TODO_STATE'), publicKey.toBuffer(), Uint8Array.from([lastTodo])],
                program.programId
            );

            const tx = new anchor.web3.Transaction().add(
                await program.methods.addTodo(content).accounts({
                    todoAccount: todoPda,
                    userProfile: profilePda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                }).instruction()
            );

            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            const txSig = await program.provider.sendAndConfirm(tx);
            console.log('Todo added successfully with signature:', txSig);

            const todoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
            setTodos(todoAccounts);
            setLastTodo((prev) => prev + 1);
            setInput(""); // Clear input
            toast.success('Todo added successfully.');
        } catch (error) {
            console.error('Error adding todo:', error);
            toast.error(error.toString());
        } finally {
            setTransactionPending(false);
        }
    }
};

    
    
    
    

    const markTodo = async (todoIdx) => {
    // Ensure todoIdx is a number
    if (typeof todoIdx !== 'number') {
        console.error('Invalid todoIdx, expected a number:', todoIdx);
        return;
    }
    
    console.log('Attempting to mark todo with index:', todoIdx); // Log todoIdx correctly
    
    if (program && publicKey) {
        try {
            setTransactionPending(true);
    
            const latestBlockhashInfo = await connection.getLatestBlockhash();
            const { blockhash } = latestBlockhashInfo;
    
            // Derive the PDA for the user profile
            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('USER_STATE'), publicKey.toBuffer()],
                program.programId
            );
    
            // Derive the PDA for the todo account using todoIdx as u8
            const [todoPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('TODO_STATE'), publicKey.toBuffer(), new Uint8Array([todoIdx])],
                program.programId
            );
    
            // Fetch the todo account to check if it exists
            const todoAccountInfo = await connection.getAccountInfo(todoPda);
            if (!todoAccountInfo) {
                throw new Error('Todo account does not exist.');
            }
    
            // Fetch todo account details
            const todoAccount = await program.account.todoAccount.fetch(todoPda);
            console.log('Fetched todo account:', {
                authority: todoAccount.authority.toBase58(), // Properly log the authority as a string
                idx: todoAccount.idx,
                content: todoAccount.content,
                marked: todoAccount.marked,
            });
    
            if (todoAccount.marked) {
                toast.error('This todo is already marked.');
                return;
            }
    
            // Build and send transaction to mark the todo
            const tx = new anchor.web3.Transaction().add(
                await program.methods.markTodo(todoIdx).accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                }).instruction()
            );
    
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;
    
            const txSig = await program.provider.sendAndConfirm(tx);
            console.log('Transaction successful with signature:', txSig);
    
            // Fetch updated todos after marking the todo
            const updatedTodoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
            setTodos(updatedTodoAccounts);
            toast.success('Successfully marked todo.');
        } catch (error) {
            console.error('Error marking todo:', error);
            toast.error(error.toString());
        } finally {
            setTransactionPending(false);
        }
    }
};



const removeTodo = async (todoIdx) => {
    // Ensure todoIdx is a number
    if (typeof todoIdx !== 'number') {
        console.error('Invalid todoIdx, expected a number:', todoIdx);
        return;
    }

    console.log('Attempting to remove todo with index:', todoIdx); // Log todoIdx

    if (program && publicKey) {
        try {
            setTransactionPending(true);

            const latestBlockhashInfo = await connection.getLatestBlockhash();
            const { blockhash } = latestBlockhashInfo;

            // Derive the PDA for the user profile
            const [profilePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('USER_STATE'), publicKey.toBuffer()],
                program.programId
            );

            // Derive the PDA for the todo account using todoIdx as u8
            const [todoPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('TODO_STATE'), publicKey.toBuffer(), new Uint8Array([todoIdx])],
                program.programId
            );

            // Fetch the todo account to check if it exists
            const todoAccountInfo = await connection.getAccountInfo(todoPda);
            if (!todoAccountInfo) {
                throw new Error('Todo account does not exist.');
            }

            // Fetch todo account details
            const todoAccount = await program.account.todoAccount.fetch(todoPda);
            console.log('Fetched todo account:', {
                authority: todoAccount.authority.toBase58(),
                idx: todoAccount.idx,
                content: todoAccount.content,
                marked: todoAccount.marked,
            });

            // Build and send transaction to remove the todo
            const tx = new anchor.web3.Transaction().add(
                await program.methods.removeTodo(todoIdx).accounts({
                    userProfile: profilePda,
                    todoAccount: todoPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                }).instruction()
            );

            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            const txSig = await program.provider.sendAndConfirm(tx);
            console.log('Transaction successful with signature:', txSig);

            // Fetch updated todos after removing the todo and update the UI
            const updatedTodoAccounts = await program.account.todoAccount.all([authorFilter(publicKey.toString())]);
            setTodos(updatedTodoAccounts); // Ensure this updates both completed and incomplete todos

            toast.success('Successfully removed todo.');
        } catch (error) {
            console.error('Error removing todo:', error);
            toast.error(error.toString());
        } finally {
            setTransactionPending(false);
        }
    }
};



    
    

    const incompleteTodos = useMemo(() => todos.filter((todo) => !todo.account.marked), [todos]);
    const completedTodos = useMemo(() => todos.filter((todo) => todo.account.marked), [todos]);

    return {
        initialized,
        fetchTodos, // Expose fetchTodos function
        initializeUser,
        loading,
        transactionPending,
        todos,
        addTodo,
        markTodo,
        removeTodo,
        input,
        setInput,
    };
}
