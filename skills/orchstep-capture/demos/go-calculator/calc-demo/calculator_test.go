package calculator

import "testing"

func TestSum(t *testing.T) {
    cases := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"two plus three", 2, 3, 5},
        {"neg one plus one", -1, 1, 0},
        {"zero plus zero", 0, 0, 0},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := Sum(c.a, c.b); got != c.expected {
                t.Errorf("Sum(%d, %d) = %d; want %d", c.a, c.b, got, c.expected)
            }
        })
    }
}
