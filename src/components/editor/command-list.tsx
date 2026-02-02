import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Minus,
    Type,
} from 'lucide-react';

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length
        );
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[220px] max-h-[350px] overflow-y-auto p-1.5 bg-background/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 scrollbar-none">
            {props.items.length ? (
                <div className="flex flex-col gap-0.5">
                    {props.items.map((item: any, index: number) => (
                        <button
                            className={`flex items-center gap-2.5 w-full px-2.5 py-2 text-sm text-left rounded-lg transition-all ${index === selectedIndex
                                ? 'bg-brand/10 text-brand'
                                : 'text-muted-foreground hover:bg-muted/50'
                                }`}
                            key={index}
                            onClick={() => selectItem(index)}
                            type="button"
                        >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${index === selectedIndex ? 'bg-brand/20 border-brand/20' : 'bg-muted border-transparent'
                                }`}>
                                {item.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`font-semibold truncate ${index === selectedIndex ? 'text-brand' : 'text-foreground'}`}>{item.title}</span>
                                <span className="text-[10px] opacity-70 truncate leading-tight">{item.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-2 text-xs text-muted-foreground text-center">결과가 없습니다.</div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';
