update tournaments
set
  name = 'Green Volley',
  fee = 50,
  updated_at = now()
where code = 'pallavolo'
   or lower(name) = 'pallavolo';
