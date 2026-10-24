#!/usr/bin/env bash

calc() {
    local num1="$1"
    local op="$2"
    local num2="$3"

    case "$op" in
        +)
            echo "$(( num1 + num2 ))"
            ;;
        -)
            echo "$(( num1 - num2 ))"
            ;;
        \*|x|X)
            echo "$(( num1 * num2 ))"
            ;;
        /)
            if (( num2 == 0 )); then
                echo "Error: Division by zero" >&2
                return 1
            fi
            echo "$(( num1 / num2 ))"
            ;;
        \*\*|\^)
            echo "$(( num1 ** num2 ))"
            ;;
        *)
            echo "Error: Unsupported operator '$op'. Use +, -, *, x, /, or ^" >&2
            return 1
            ;;
    esac
}

calc "$@"
